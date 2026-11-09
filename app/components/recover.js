// Shared by the error pages: report the crash to the admin page, then clear this site's
// saved data (recent checks, a half-finished check) and reload once.
const KEYS = ["dasms_recent", "dasms_job"];

export function reportError(error) {
  try {
    fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: String(error?.message || error || "unknown").slice(0, 300),
        stack: String(error?.stack || "").slice(0, 1200),
        digest: error?.digest || "",
        page: typeof location !== "undefined" ? location.pathname : "",
        agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function clearSaved() {
  try {
    KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Returns true if it's reloading the page to recover (only tried once per visit).
export function tryRecover() {
  try {
    if (sessionStorage.getItem("dasms_recovered")) return false;
    sessionStorage.setItem("dasms_recovered", "1");
  } catch {
    return false;
  }
  clearSaved();
  location.reload();
  return true;
}
