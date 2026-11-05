// Counters (by day, month and year) and a log of every scan, shown on the owner's /admin page.
import { increment, getCounts, pushToList, getList, listLength } from "./store";

const DAY = 24 * 60 * 60;
const KEEP_FOREVER = 3650 * DAY; // 10 years
export const METRICS = ["scans", "ownerScans", "cached", "limited", "errors", "requests"];
export const LOG_MAX = 5000;

const dayKey = (d) => d.toISOString().slice(0, 10); // 2026-11-01
const monthKey = (d) => d.toISOString().slice(0, 7); // 2026-11
const yearKey = (d) => d.toISOString().slice(0, 4); // 2026

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
    const now = new Date();
    await increment(`stats:${name}:${dayKey(now)}`, 400 * DAY);
    await increment(`stats:m:${name}:${monthKey(now)}`, KEEP_FOREVER);
    await increment(`stats:y:${name}:${yearKey(now)}`, KEEP_FOREVER);
    await increment(`stats:${name}:all`, KEEP_FOREVER);
  });
}

export function logScan(entry) {
  return safe(() => pushToList("stats:log", { at: new Date().toISOString(), ...entry }, LOG_MAX));
}

// The time periods for each view, oldest first.
function periods(view) {
  const now = new Date();
  if (view === "year") {
    const y = now.getUTCFullYear();
    return Array.from({ length: 5 }, (_, i) => {
      const key = String(y - 4 + i);
      return { key, prefix: "stats:y:", label: key };
    });
  }
  if (view === "month") {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
      return {
        key: monthKey(d),
        prefix: "stats:m:",
        label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      };
    });
  }
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (29 - i));
    return { key: dayKey(d), prefix: "stats:", label: String(d.getUTCDate()) };
  });
}

export async function loadStats(view = "day") {
  const ps = periods(view);
  const keys = [];
  for (const m of METRICS) {
    keys.push(`stats:${m}:all`);
    for (const p of ps) keys.push(`${p.prefix}${m}:${p.key}`);
  }
  const values = await getCounts(keys);

  const totals = {};
  const series = {};
  let i = 0;
  for (const m of METRICS) {
    totals[m] = values[i++];
    series[m] = ps.map(() => values[i++]);
  }
  return { periods: ps, totals, series };
}

export async function loadLog(page = 1, perPage = 50) {
  const start = (page - 1) * perPage;
  const [items, total] = await Promise.all([getList("stats:log", start, start + perPage - 1), listLength("stats:log")]);
  return { items, total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

// Sort error messages into simple groups for the health panel.
// "user" groups are visitor mistakes (like a typo in the address), not system problems.
export function errorType(message = "") {
  const m = String(message);
  if (/credit|billing|balance|quota/i.test(m)) return { type: "Out of API credit", system: true };
  if (/rate.?limit|429|overloaded|529|too many requests/i.test(m)) return { type: "AI busy (rate limit)", system: true };
  if (/didn't complete|ai checks/i.test(m)) return { type: "AI searches failed", system: true };
  if (/timeout|timed out|aborted|abort/i.test(m)) return { type: "Timed out", system: true };
  if (/api|anthropic|openai|401|403|500|502|503|json/i.test(m)) return { type: "AI service error", system: true };
  if (/web address|public store|couldn't open|look like a web address|automated tools/i.test(m)) return { type: "Couldn't open the store", system: false };
  if (/redis|upstash|database/i.test(m)) return { type: "Database error", system: true };
  return { type: "Other", system: true };
}
