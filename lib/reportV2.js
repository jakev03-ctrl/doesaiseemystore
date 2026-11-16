// What visitors see of a v2 report. Free reports show the agreed parts; everything else is
// replaced on the server with look-alike filler (shown blurred), so it can't be "un-blurred".
import { publicH2H } from "./h2h";

const LOREM = "loremipsumdolorsitametconsecteturadipiscingelitseddoeiusmodtemporincididuntutlaboreetdoloremagnaaliqua";
export function fill(s) {
  let i = 0;
  return String(s ?? "").replace(/[A-Za-z0-9£$€]/g, () => LOREM[i++ % LOREM.length]);
}
const firstSentence = (t) => {
  const m = String(t || "").match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : String(t || "");
};

export function publicViewV2(report, { full = false } = {}) {
  const main = (report.questions || []).filter((q) => !q.mine && q.ok !== false);
  const mine = (report.questions || []).filter((q) => q.mine && q.ok !== false);
  const base = {
    version: 2,
    id: report.id,
    createdAt: report.createdAt,
    shop: report.shop,
    category: report.category,
    location: report.location || "",
    extra: report.extra || "",
    market: report.market?.label || report.location || "",
    marketCountry: report.market?.country || null,
    subject: report.subject === "them" ? "them" : "you",
    customs: report.customs || [],
    previous: report.previous || null,
    history: (report.history || []).filter((h) => typeof h.overall === "number"),
    h2h: publicH2H(report.h2h, full),
    profile: report.profile,
    peers: report.peers || [],
    score: report.score,
    goodNews: report.goodNews,
    stepsTime: report.stepsTime,
    overall: report.overall,
    label: report.label,
    found: report.found,
    checked: report.checked,
    pagesRead: report.pagesRead || 1,
    productsRead: report.shop?.productsRead || 0,
    rivalsStudied: report.winners ? 1 : 0,
    followUps: [report.ladder?.push, report.ladder?.quote, report.ladder?.narrow].filter(Boolean).length,
    locked: !full,
  };

  const searchRow = (q) => ({ question: q.question, slot: q.slot, group: q.group, homeTurf: Boolean(q.homeTurf), level: q.level, position: q.position, verdict: q.verdict, picks: (q.picks || []).filter((p) => p !== "@self").slice(0, 3) });

  if (full) {
    return {
      ...base,
      glance: report.glance || [],
      replay: report.replay ? { ...report.replay, lines: lines(report.replay.text).map((t) => ({ t })) } : null,
      steps: report.steps || [],
      searches: main.map(searchRow),
      own: mine.map(searchRow),
      ladder: report.ladder,
      winners: report.winners,
      marketView: report.marketView,
      accuracy: report.accuracy || [],
      ready: report.ready || [],
      products: report.products || [],
      snippet: report.snippet,
      plan: report.plan || [],
      checks: report.checks || null,
      competitors: report.competitors || [],
    };
  }

  // ---- Free version ----
  const glance = (report.glance || []).map((g) => {
    const head = firstSentence(g.para);
    return { key: g.key, lead: g.lead, head, tail: fill(g.para.slice(head.length)), facts: g.facts.map(([a, b]) => [fill(a), fill(b)]), factsBlur: true };
  });

  let replay = null;
  if (report.replay) {
    const ls = lines(report.replay.text);
    const firstItem = ls.findIndex((l) => /^\s*(\d+[.)]|[-•*])\s+/.test(l));
    const keep = firstItem >= 0 ? firstItem + 1 : Math.min(2, ls.length);
    replay = {
      ...report.replay,
      text: "",
      lines: ls.map((t, i) => (i < keep ? { t } : { t: fill(t), blur: true })),
      queries: (report.replay.queries || []).map(fill),
      hosts: (report.replay.hosts || []).map(fill),
      metaBlur: true,
      why: (report.replay.why || []).map((w, i) => (i === 0 ? w : { title: fill(w.title), factor: "F0", detail: fill(w.detail), blur: true })),
    };
  }

  const steps = (report.steps || []).slice(0, 3).map((s, i) =>
    i === 0 ? s : { title: fill(s.title), factor: "F0", evidence: fill(s.evidence), how: fill(s.how), effort: "00 min", level: "Quick", impact: fill(s.impact), blur: true }
  );

  const blurRow = (q) => ({ question: fill(q.question), slot: fill(q.slot), group: q.group, homeTurf: false, level: "hidden", verdict: fill(q.verdict), picks: (q.picks || []).filter((p) => p !== "@self").slice(0, 2).map(fill), blur: true });
  const searches = main.map((q, i) => (i < 3 ? searchRow(q) : blurRow(q)));

  const L = report.ladder || {};
  const quoteHead = firstSentence(L.quote);
  const ladder = { ...L, quote: quoteHead, quoteTail: fill(String(L.quote || "").slice(quoteHead.length)), othersBlur: true };

  const W = report.winners;
  const winners = W
    ? { rival: W.rival, rows: W.rows.map((r, i) => (i === 0 ? r : { label: fill(r.label), factor: "F0", them: fill(r.them), themOk: true, you: fill(r.you), youOk: false, blur: true })), doWell: fill(W.doWell), quickWins: fill(W.quickWins), extrasBlur: true }
    : null;

  const M = report.marketView || {};
  const marketView = {
    ...M,
    share: (M.share || []).map((s, i) => (i < 2 ? s : { name: fill(s.name), pct: 5 + i, blur: true })),
    youBlur: true,
    peers: [...(M.peers || [])].sort((a, b) => b.pct - a.pct).map((p, i) => (i < 1 ? p : { ...p, pct: 8 + i * 3, blur: true })),
    rewards: (M.rewards || []).map((r, i) => (i < 2 ? r : { reason: fill(r.reason), count: 0, blur: true })),
    sources: (M.sources || []).map((s) => ({ host: fill(s.host), pct: 30, you: s.you, blur: true })),
    note: fill(M.note),
    priceRange: M.priceRange ? fill(M.priceRange) : null,
    noteBlur: true,
  };

  return {
    ...base,
    glance,
    replay,
    steps,
    moreSteps: Math.max(0, (report.steps || []).length - 1),
    searches,
    own: mine.map(blurRow),
    ladder,
    winners,
    marketView,
    accuracy: (report.accuracy || []).map((a, i) => (i === 0 ? a : { topic: fill(a.topic), ai: fill(a.ai), store: fill(a.store), verdict: "wrong", blur: true })),
    ready: (report.ready || []).map((r, i) => (i < 4 ? r : { factor: "F0", title: fill(r.title), ok: true, detail: fill(r.detail), blur: true })),
    products: (report.products || []).map((p) => ({ title: fill(p.title), price: "", mentions: 0, blur: true })),
    snippet: report.snippet ? { title: fill(report.snippet.title), text: fill(report.snippet.text), blur: true } : null,
    plan: (report.plan || []).map((p) => ({ stage: fill(p.stage), actions: p.actions.map(fill), blur: true })),
  };
}

function lines(text) {
  return String(text || "")
    .replace(/\*\*|__/g, "")
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 24);
}
