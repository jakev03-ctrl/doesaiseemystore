// Who is allowed to scan, and how many times a day.
import { createHash } from "crypto";
import { getCount, increment, getJSON } from "./store";

export const DEVICE_COOKIE = "dasms_device";
export const OWNER_COOKIE = "dasms_owner";

const FREE_PER_DAY = Number(process.env.FREE_SCANS_PER_DAY || 2);
const OWNER_PER_DAY = Number(process.env.OWNER_SCANS_PER_DAY || 20);
// Backstop per internet connection, in case someone clears cookies to get more.
const IP_PER_DAY = Number(process.env.IP_SCANS_PER_DAY || 6);

const TWO_DAYS = 2 * 24 * 60 * 60;

export function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
}

// A keyed one-way hash for IP addresses, so they can't be looked up from the stored value.
export function scramble(value) {
  const secret = process.env.HASH_SECRET || process.env.ADMIN_KEY || "dasms";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex").slice(0, 32);
}

// Safety net for costs: the most free checks the whole site will run in one day.
const DAILY_CAP = Number(process.env.DAILY_CHECK_CAP || 300);

export function isOwner(ownerCookie) {
  const key = process.env.ADMIN_KEY;
  return Boolean(key && ownerCookie && ownerCookie === hash(key));
}

// The owner's "full report" link for one report: ?access=<this>. It's worked out from your
// ADMIN_KEY, so nothing needs storing, it can't be guessed, and it works for as long as the report exists.
export function fullToken(id) {
  const key = process.env.ADMIN_KEY;
  if (!key || !id) return "";
  return createHash("sha256").update(`share-full:${key}:${id}`).digest("base64url").slice(0, 22);
}

// Can someone with this ?access= code see report `id` in full? Either the owner's full link,
// or a private link sent from the enquiries page.
export async function canSeeFull(id, access) {
  if (!access) return false;
  const t = fullToken(id);
  if (t && access === t) return true;
  return (await getJSON(`share:${access}`).catch(() => null)) === id;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function keys(deviceId, ip) {
  const d = today();
  return {
    device: `limit:device:${deviceId}:${d}`,
    ip: `limit:ip:${scramble(ip)}:${d}`,
    global: `limit:global:${d}`,
  };
}

// Check before scanning.
export async function checkLimit({ deviceId, ip, owner }) {
  const k = keys(deviceId, ip);
  const limit = owner ? OWNER_PER_DAY : FREE_PER_DAY;
  const used = await getCount(k.device);
  if (used >= limit) return { ok: false, remaining: 0, limit };
  if (!owner) {
    const ipUsed = await getCount(k.ip);
    if (ipUsed >= IP_PER_DAY) return { ok: false, remaining: 0, limit };
    const all = await getCount(k.global);
    if (all >= DAILY_CAP) return { ok: false, remaining: limit - used, limit, busy: true };
  }
  return { ok: true, remaining: limit - used, limit };
}

// Count a finished scan.
export async function recordScan({ deviceId, ip, owner }) {
  const k = keys(deviceId, ip);
  const used = await increment(k.device, TWO_DAYS);
  if (!owner) {
    await increment(k.ip, TWO_DAYS);
    await increment(k.global, TWO_DAYS);
  }
  const limit = owner ? OWNER_PER_DAY : FREE_PER_DAY;
  return Math.max(0, limit - used);
}
