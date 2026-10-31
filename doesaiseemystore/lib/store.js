// Small storage layer. Uses the Upstash Redis database when it's connected in
// Vercel; otherwise falls back to temporary memory (fine for testing only).
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export const hasDatabase = Boolean(redis);

const mem = new Map();

function memGet(key) {
  const e = mem.get(key);
  if (!e) return null;
  if (e.exp < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e;
}

export async function getJSON(key) {
  if (redis) return (await redis.get(key)) ?? null;
  return memGet(key)?.value ?? null;
}

export async function setJSON(key, value, ttlSeconds) {
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }
  mem.set(key, { value, exp: Date.now() + ttlSeconds * 1000 });
}

export async function getCount(key) {
  return Number(await getJSON(key)) || 0;
}

export async function increment(key, ttlSeconds) {
  if (redis) {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, ttlSeconds);
    return n;
  }
  const e = memGet(key);
  const n = (Number(e?.value) || 0) + 1;
  mem.set(key, { value: n, exp: e?.exp ?? Date.now() + ttlSeconds * 1000 });
  return n;
}

// Lists (newest first), used for the owner's stats page.
const memLists = new Map();

export async function pushToList(key, item, max = 1000) {
  if (redis) {
    await redis.lpush(key, item);
    await redis.ltrim(key, 0, max - 1);
    return;
  }
  const arr = memLists.get(key) || [];
  arr.unshift(item);
  if (arr.length > max) arr.length = max;
  memLists.set(key, arr);
}

export async function getList(key, start = 0, end = 99) {
  if (redis) return (await redis.lrange(key, start, end)) || [];
  return (memLists.get(key) || []).slice(start, end + 1);
}
