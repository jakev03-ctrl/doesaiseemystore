// "Your recent checks": a short list saved only in the visitor's own browser.
const KEY = "dasms_recent";
const MAX = 5;

export function loadRecent() {
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list.filter((r) => r && r.id) : [];
  } catch {
    return [];
  }
}

export function saveRecent(report) {
  const list = loadRecent();
  if (!report?.id) return list;
  const item = {
    id: report.id,
    name: report.shop?.name || report.shop?.domain || "Your store",
    domain: report.shop?.domain || "",
    overall: report.overall,
    at: report.createdAt || new Date().toISOString(),
  };
  // One entry per store: keep the newest check.
  const next = [item, ...list.filter((r) => r.id !== item.id && r.domain !== item.domain)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function isRecent(id) {
  return loadRecent().some((r) => r.id === id);
}
