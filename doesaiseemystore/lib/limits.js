// Who is allowed to scan, and how many times a day.
import { createHash } from "crypto";
import { getCount, increment } from "./store";

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

export function isOwner(ownerCookie) {
  const key = process.env.ADMIN_KEY;
  return Boolean(key && ownerCookie && ownerCookie === hash(key));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function keys(deviceId, ip) {
  const d = today();
  return {
    device: `limit:device:${deviceId}:${d}`,
    ip: `limit:ip:${hash(ip)}:${d}`,
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
  }
  return { ok: true, remaining: limit - used, limit };
}

// Count a finished scan.
export async function recordScan({ deviceId, ip, owner }) {
  const k = keys(deviceId, ip);
  const used = await increment(k.device, TWO_DAYS);
  if (!owner) await increment(k.ip, TWO_DAYS);
  const limit = owner ? OWNER_PER_DAY : FREE_PER_DAY;
  return Math.max(0, limit - used);
}
