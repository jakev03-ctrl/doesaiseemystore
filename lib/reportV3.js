// What visitors see of a v3 report (the three-phase check). Free reports show the agreed parts;
// everything else is replaced on the server with look-alike filler (shown blurred), so it can't be "un-blurred".
import { publicH2H } from "./h2h";
import { fill } from "./reportV2";

const firstSentence = (t) => {
  const m = String(t || "").match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : String(t || "");
};

function lines(text) {
  return String(text || "")
    .replace(/\*\*|__/g, "")
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 24);
}

export function publicViewV3(report, { full = false } = {}) {
  const main = (report.questions || []).filter((q) => !q.mine && q.ok !== false);
  const mine = (report.questions || []).filter((q) => q.mine && q.ok !== false);
  const base = {
    version: 3,
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
    score: report.score,
    goodNews: report.goodNews,
    stepsTime: report.stepsTime,
    overall: report.overall,
    label: report.label,
    found: report.found,
    checked: report.checked,
    pagesRead: report.pagesRead || 1,
    productsRead: report.shop?.productsRead || 0,
    webSearched: Boolean(report.web),
    siteUnreachable: Boolean(report.siteUnreachable),
    pushed: Boolean(report.ladder?.push),
    locked: !full,
  };
  const row = (q) => ({ question: q.question, group: q.group, label: q.label, homeTurf: Boolean(q.homeTurf), level: q.level, position: q.position, verdict: q.verdict, picks: (q.picks || []).filter((p) => p !== "@self").slice(0, 3) });

  if (full) {
    return {
      ...base,
      site: report.site || { good: [], bad: [] },
      glance: report.glance || [],
      searches: main.map(row),
      own: mine.map(row),
      ladder: report.ladder || {},
      web: report.web ? { ...report.web, lines: lines(report.web.text).map((t) => ({ t })) } : null,
      instead: report.instead || [],
      replay: report.replay ? { ...report.replay, lines: lines(report.replay.text).map((t) => ({ t })) } : null,
      steps: report.steps || [],
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
    return { key: g.key, lead: g.lead, head, tail: fill(g.para.slice(head.length)), facts: (g.facts || []).map(([a, b]) => [fill(a), fill(b)]), factsBlur: true };
  });

  // 1. Searches: the first 3 readable.
  const blurRow = (q) => ({ question: fill(q.question), group: q.group, label: fill(q.label), homeTurf: false, level: "hidden", verdict: fill(q.verdict), picks: (q.picks || []).filter((p) => p !== "@self").slice(0, 2).map(fill), blur: true });
  const searches = main.map((q, i) => (i < 3 ? row(q) : blurRow(q)));

  // 2. Website: profile readable; first good and first missing point readable; 4 checklist boxes.
  const S = report.site || { good: [], bad: [] };
  const site = { good: S.good.map((x, i) => (i === 0 ? x : { t: fill(x), blur: true })), bad: S.bad.map((x, i) => (i === 0 ? x : { t: fill(x), blur: true })) };
  const ready = (report.ready || []).map((r, i) => (i < 4 ? r : { factor: "F0", title: fill(r.title), ok: r.ok === null ? null : true, detail: fill(r.detail), blur: true }));

  // 3. The web: known or not, where they turn up (yes/no), the first sentence of what AI said; 1 accuracy row.
  let web = null;
  if (report.web) {
    const ls = lines(report.web.text);
    web = {
      known: report.web.known,
      question: report.web.question,
      rating: report.web.rating ? fill(report.web.rating) : "",
      ratingBlur: true,
      summary: report.web.summary,
      presence: (report.web.presence || []).map((p) => ({ key: p.key, label: p.label, found: p.found, hosts: p.hosts.map(fill), hostsBlur: true })),
      lines: ls.map((t, i) => (i === 0 ? { t: firstSentence(t), tail: fill(t.slice(firstSentence(t).length)) } : { t: fill(t), blur: true })),
    };
  }
  const accuracy = (report.accuracy || []).map((a, i) => (i === 0 ? a : { topic: fill(a.topic), ai: fill(a.ai), store: fill(a.store), verdict: "wrong", blur: true }));

  // 4. Who instead: names visible (top 1 with its reason), the rest blurred; replay first item + first why.
  const instead = (report.instead || []).map((x, i) => (i === 0 ? x : { name: x.name, pct: x.pct, marketplace: x.marketplace, why: fill(x.why), factor: "F0", whyBlur: true }));
  let replay = null;
  if (report.replay) {
    const ls = lines(report.replay.text);
    const firstItem = ls.findIndex((l) => /^\s*(\d+[.)]|[-•*])\s+/.test(l));
    const keep = firstItem >= 0 ? firstItem + 1 : Math.min(2, ls.length);
    replay = {
      ...report.replay,
      text: "",
      lines: ls.map((t, i) => (i < keep ? { t } : { t: fill(t), blur: true })),
      hosts: (report.replay.hosts || []).map(fill),
      metaBlur: true,
      why: (report.replay.why || []).map((w, i) => (i === 0 ? w : { title: fill(w.title), factor: "F0", detail: fill(w.detail), blur: true })),
    };
  }

  // 5. Fixes: step 1 only. Snippet and plan hidden.
  const steps = (report.steps || []).slice(0, 3).map((s, i) =>
    i === 0 ? s : { title: fill(s.title), factor: "F0", evidence: fill(s.evidence), how: fill(s.how), effort: "00 min", level: "Quick", impact: fill(s.impact), blur: true }
  );

  return {
    ...base,
    glance,
    searches,
    own: mine.map(blurRow),
    ladder: { here: report.ladder?.here, known: report.ladder?.known, push: report.ladder?.push ? { present: report.ladder.push.present, position: report.ladder.push.position } : null },
    site,
    ready,
    web,
    accuracy,
    instead,
    replay,
    steps,
    moreSteps: Math.max(0, (report.steps || []).length - 1),
    products: (report.products || []).map((p) => ({ title: fill(p.title), price: "", mentions: 0, blur: true })),
    snippet: report.snippet ? { title: fill(report.snippet.title), text: fill(report.snippet.text), blur: true } : null,
    plan: (report.plan || []).map((p) => ({ stage: p.stage, actions: p.actions.map(fill), blur: true })),
  };
}
