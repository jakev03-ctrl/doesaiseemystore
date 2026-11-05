// Storage layer. Works with whichever database Vercel connected:
//  - Upstash Redis / Vercel KV (REST keys, any name prefix), or
//  - a standard Redis connection string (REDIS_URL).
// Without either, it falls back to temporary memory (testing only).
import { Redis } from "@upstash/redis";

// Find a setting whose NAME ends with one of these, even if Vercel added a prefix
// (e.g. "STORAGE_KV_REST_API_URL").
function findEnv(suffixes, exclude = []) {
  const names = Object.keys(process.env).sort();
  for (const suffix of suffixes) {
    const exact = process.env[suffix];
    if (exact) return { name: suffix, value: exact };
    const hit = names.find((n) => n.endsWith("_" + suffix) && !exclude.some((x) => n.includes(x)) && process.env[n]);
    if (hit) return { name: hit, value: process.env[hit] };
  }
  return null;
}

const restUrl = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "REDIS_REST_URL"]);
const restToken = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "REDIS_REST_TOKEN"], ["READ_ONLY"]);
const redisUrl = findEnv(["REDIS_URL", "KV_URL"]);

let mode = "memory";
let upstash = null;
if (restUrl && restToken) {
  upstash = new Redis({ url: restUrl.value, token: restToken.value });
  mode = "upstash";
} else if (redisUrl && /^rediss?:\/\//.test(redisUrl.value)) {
  mode = "redis";
}

export const hasDatabase = mode !== "memory";
export const databaseInfo = {
  mode,
  using: mode === "upstash" ? `${restUrl.name} + ${restToken.name}` : mode === "redis" ? redisUrl.name : null,
  // Names only (never values), to help spot setup problems on the admin page.
  seen: Object.keys(process.env).filter((n) => /KV|REDIS|UPSTASH/i.test(n)).sort(),
};

// ---- standard Redis connection (only loaded if needed) ----
let tcpClient = null;
async function tcp() {
  if (tcpClient) return tcpClient;
  const { createClient } = await import("redis");
  const client = createClient({ url: redisUrl.value, socket: { connectTimeout: 8000 } });
  client.on("error", (e) => console.error("Redis error:", e?.message));
  await client.connect();
  tcpClient = client;
  return client;
}

const enc = (v) => JSON.stringify(v);
const dec = (v) => {
  if (v == null) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

// ---- temporary memory fallback ----
const mem = new Map();
const memLists = new Map();
function memGet(key) {
  const e = mem.get(key);
  if (!e) return null;
  if (e.exp < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e;
}

// ---- public functions ----
export async function getJSON(key) {
  if (mode === "upstash") return (await upstash.get(key)) ?? null;
  if (mode === "redis") return dec(await (await tcp()).get(key));
  return memGet(key)?.value ?? null;
}

export async function setJSON(key, value, ttlSeconds) {
  if (mode === "upstash") return void (await upstash.set(key, value, { ex: ttlSeconds }));
  if (mode === "redis") return void (await (await tcp()).set(key, enc(value), { EX: ttlSeconds }));
  mem.set(key, { value, exp: Date.now() + ttlSeconds * 1000 });
}

export async function getCount(key) {
  return Number(await getJSON(key)) || 0;
}

export async function getCounts(keys) {
  if (!keys.length) return [];
  if (mode === "upstash") return ((await upstash.mget(...keys)) || []).map((v) => Number(v) || 0);
  if (mode === "redis") return ((await (await tcp()).mGet(keys)) || []).map((v) => Number(v) || 0);
  return keys.map((k) => Number(memGet(k)?.value) || 0);
}

export async function increment(key, ttlSeconds) {
  if (mode === "upstash" || mode === "redis") {
    const c = mode === "upstash" ? upstash : await tcp();
    const n = await c.incr(key);
    if (n === 1) await c.expire(key, ttlSeconds);
    return n;
  }
  const e = memGet(key);
  const n = (Number(e?.value) || 0) + 1;
  mem.set(key, { value: n, exp: e?.exp ?? Date.now() + ttlSeconds * 1000 });
  return n;
}

export async function pushToList(key, item, max = 1000) {
  if (mode === "upstash") {
    await upstash.lpush(key, item);
    await upstash.ltrim(key, 0, max - 1);
    return;
  }
  if (mode === "redis") {
    const c = await tcp();
    await c.lPush(key, enc(item));
    await c.lTrim(key, 0, max - 1);
    return;
  }
  const arr = memLists.get(key) || [];
  arr.unshift(item);
  if (arr.length > max) arr.length = max;
  memLists.set(key, arr);
}

export async function getList(key, start = 0, end = 99) {
  if (mode === "upstash") return (await upstash.lrange(key, start, end)) || [];
  if (mode === "redis") return ((await (await tcp()).lRange(key, start, end)) || []).map(dec);
  return (memLists.get(key) || []).slice(start, end + 1);
}

export async function listLength(key) {
  if (mode === "upstash") return (await upstash.llen(key)) || 0;
  if (mode === "redis") return (await (await tcp()).lLen(key)) || 0;
  return (memLists.get(key) || []).length;
}

// Delete list entries older than `days` (lists are newest first, each entry has an `at` date).
export async function trimOlderThan(key, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const items = await getList(key, 0, -1);
  const keep = items.findIndex((it) => it?.at && new Date(it.at).getTime() < cutoff);
  if (keep === -1) return 0;
  if (mode === "upstash") {
    if (keep === 0) await upstash.del(key);
    else await upstash.ltrim(key, 0, keep - 1);
  } else if (mode === "redis") {
    const c = await tcp();
    if (keep === 0) await c.del(key);
    else await c.lTrim(key, 0, keep - 1);
  } else {
    memLists.set(key, items.slice(0, keep));
  }
  return items.length - keep;
}
