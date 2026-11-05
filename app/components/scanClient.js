// Runs a check in the background and waits for it. If the visitor leaves or their phone
// locks, the check keeps going on the server, and the page picks it up again when they return.
const KEY = "dasms_job";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function save(job) {
  try {
    if (job) localStorage.setItem(KEY, JSON.stringify(job));
    else localStorage.removeItem(KEY);
  } catch {}
}

// A check that was still running when the visitor left (under 5 minutes old).
export function pendingJob() {
  try {
    const job = JSON.parse(localStorage.getItem(KEY) || "null");
    if (job && Date.now() - job.at < 5 * 60 * 1000) return job;
  } catch {}
  return null;
}

export async function waitForJob(job, { signal } = {}) {
  const until = Date.now() + 5 * 60 * 1000;
  while (Date.now() < until) {
    if (signal?.aborted) throw new Error("cancelled");
    let data = null;
    try {
      const res = await fetch(`/api/scan?job=${encodeURIComponent(job.job)}`, { cache: "no-store" });
      data = await res.json();
    } catch {
      // Lost connection for a moment (e.g. phone waking up): try again shortly.
    }
    if (data?.status === "done") {
      save(null);
      return data.report;
    }
    if (data?.status === "error" || data?.status === "missing") {
      save(null);
      throw new Error(data.error || "Something went wrong. Please try again.");
    }
    await sleep(2000);
  }
  save(null);
  throw new Error("This check is taking longer than usual. Please try again in a minute.");
}

export async function runScanJob(details, { remember = true } = {}) {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  if (!data.job) return data; // a saved result from earlier today comes straight back
  const job = { job: data.job, at: Date.now(), location: details.location || "" };
  if (remember) save(job);
  return waitForJob(job);
}
