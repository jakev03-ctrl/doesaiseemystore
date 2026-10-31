// Simple counters and a log of recent scans, shown on the owner's /admin page.
import { increment, getCount, pushToList, getList } from "./store";

const DAY = 24 * 60 * 60;
export const METRICS = ["scans", "ownerScans", "cached", "limited", "errors"];

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// Never let stats tracking break a scan.
async function safe(fn) {
  try {
    await fn();
  } catch (e) {
    console.error("Stats error:", e?.message);
  }
}

export function countEvent(name) {
  return safe(async () => {
    await increment(`stats:${name}:${dateKey()}`, 120 * DAY);
    await increment(`stats:${name}:all`, 3650 * DAY);
  });
}

export function logScan(entry) {
  return safe(() => pushToList("stats:log", { at: new Date().toISOString(), ...entry }, 1000));
}

export async function loadStats(days = 14) {
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return dateKey(d);
  });

  const totals = {};
  const daily = {};
  for (const m of METRICS) {
    totals[m] = await getCount(`stats:${m}:all`);
    daily[m] = await Promise.all(dates.map((d) => getCount(`stats:${m}:${d}`)));
  }
  const log = await getList("stats:log", 0, 499);
  return { dates, totals, daily, log };
}
