"use client";

import { useEffect, useState } from "react";
import { isRecent } from "./recent";
import EmailReport from "./EmailReport";
import QuestionExplorer from "./QuestionExplorer";
import { H2HCard, H2HBox } from "./HeadToHead";

// While full reports are free (to collect reviews). Set NEXT_PUBLIC_FREE_REPORTS=0 in Vercel to switch off.
const FREE_REPORTS = process.env.NEXT_PUBLIC_FREE_REPORTS !== "0";

// The score gauge fills and the number counts up from 0.
function Gauge({ value }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame;
    const start = performance.now() + 250;
    setShown(0);
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / 1400));
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const colour = value >= 70 ? "var(--good)" : value >= 40 ? "var(--mid)" : "var(--bad)";
  const LEN = 314.16;
  return (
    <svg className="gauge-svg" viewBox="0 0 240 150" role="img" aria-label={`Score ${value} out of 100`}>
      <path d="M20 128 A100 100 0 0 1 220 128" fill="none" stroke="var(--line-soft)" strokeWidth="18" strokeLinecap="round" />
      <path d="M20 128 A100 100 0 0 1 220 128" fill="none" stroke={colour} strokeWidth="18" strokeLinecap="round" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - shown / 100)} />
      <text x="120" y="112" textAnchor="middle" fontFamily="Georgia, serif" fontSize="52" fontWeight="700" fill="var(--ink)">
        {shown}
      </text>
      <text x="120" y="138" textAnchor="middle" fontSize="13" fill="var(--muted)">
        out of 100
      </text>
    </svg>
  );
}

// A small "i" button that shows a plain-English explanation.
function Tip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="tip">
      <button type="button" className="tip-btn" aria-label="What does this mean?" aria-expanded={open} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)}>
        i
      </button>
      {open && (
        <span className="tip-box" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}

const TIPS = {
  score: "Your overall score out of 100. It combines how often AI recommended you with how easy your product info is for AI to read.",
  stats: "Worked out from the real searches we ran for your store, not estimated.",
  map: "How many of our searches each store was recommended in. More mentions means AI trusts that store more for what you sell.",
  categories: "How often you were recommended for each type of search, like price, quality or gift searches.",
  checks: "Things we checked directly on your website, so you know exactly what's already in place.",
  snippets: "Ready-written text you can paste straight onto your store. Fill in anything in [square brackets] first.",
};

const CHECK_ROWS = [
  ["aiAccess", "AI access"],
  ["sitemap", "Sitemap"],
  ["productData", "Product data for AI"],
  ["policies", "Delivery & returns"],
];

const longDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function scoreLine(r) {
  if (!r.checked) return "";
  if (!r.found) return `AI didn't recommend you in any of the ${r.checked} shopper searches we ran.`;
  return `AI recommends you in ${r.found} out of ${r.checked} shopper searches.`;
}

function Bar({ label, value, max, you }) {
  return (
    <div className={`bar${you ? " you" : ""}`}>
      <span className="bar-name">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.max(4, (value / Math.max(1, max)) * 100)}%` }} />
      </div>
      <span className="bar-num">{value}</span>
    </div>
  );
}

function strength(pct) {
  if (pct >= 60) return { word: "Strong", cls: "good" };
  if (pct >= 25) return { word: "Some", cls: "mid" };
  return { word: "Weak", cls: "bad" };
}

// Placeholder rows shown blurred. The real hidden details are never sent to the browser.
const filler = (n, make) => Array.from({ length: Math.min(n || 0, 4) }, (_, i) => make(i));

// Score over time (needs at least 2 checks).
function Trend({ history }) {
  const pts = history.slice(-8);
  const W = 520;
  const H = 130;
  const L = 30;
  const R = 16;
  const T = 18;
  const B = 24;
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, pts.length - 1);
  const y = (v) => T + (1 - v / 100) * (H - T - B);
  const line = pts.map((p, i) => `${x(i)},${y(p.overall)}`).join(" ");
  const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Scores: ${pts.map((p) => p.overall).join(", ")}`}>
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      <polygon points={`${x(0)},${y(0)} ${line} ${x(pts.length - 1)},${y(0)}`} fill="var(--accent)" opacity="0.14" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => {
        const end = i === pts.length - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.overall)} r={end ? 5.5 : 4} fill={end ? "var(--good)" : "var(--accent)"} />
            <text x={x(i)} y={y(p.overall) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--soft)">
              {p.overall}
            </text>
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {end ? "Today" : day(p.at)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PointList({ items, hidden, locked, kind }) {
  return (
    <ul className={`pts ${kind}`}>
      {items.map((t, i) => (
        <li key={i}>
          <span className={`pt-ic ${kind}`} aria-hidden="true">
            {kind === "good" ? "✓" : "!"}
          </span>
          <span>{t}</span>
        </li>
      ))}
      {locked &&
        filler(hidden, (i) => (
          <li key={`h${i}`} className="blurred" aria-hidden="true">
            <span className={`pt-ic ${kind}`}>{kind === "good" ? "✓" : "!"}</span>
            <span>A hidden point, short and to the point, about your store.</span>
          </li>
        ))}
    </ul>
  );
}

function Snippet({ s }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="snippet">
      <div className="snippet-top">
        <b>{s.title}</b>
        <button
          type="button"
          className="secondary small-btn no-print"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(s.text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p>{s.text}</p>
    </div>
  );
}

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";

// "Get my full report free" opens the visitor's own email app with a message ready to send.
// Nothing is stored on the website: the enquiry is just an email to you.
function requestEmail(report) {
  const site = typeof window !== "undefined" ? window.location.origin : "https://www.doesaiseemystore.com";
  const link = report.id ? `${site}/report/${report.id}` : site;
  const subject = `Free full report: ${report.shop.domain}`;
  const body = `Hi Team,

I'd love my full report!

Link: ${link}

Please share a few details about your store so we can conduct further analysis:
`;
  return `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function LockedBottom({ report }) {
  const requestHref = requestEmail(report);
  return (
    <div className="fadewrap">
      <div className="fade" aria-hidden="true">
        <div className="card">
          <h3>Who AI recommends instead</h3>
          <div className="bars-h">
            {["Hidden competitor", "Hidden competitor", "You", "Hidden competitor"].map((l, i) => (
              <Bar key={i} label={l} value={[7, 5, 3, 2][i]} max={7} you={l === "You"} />
            ))}
          </div>
        </div>
        <div className="card">
          <h3>What you can do next</h3>
          <ol className="fixes">
            <li>Week one: placeholder text for the first stage of your plan.</li>
            <li>Weeks two and three: placeholder text for the next stage.</li>
            <li>Month two: placeholder text for the last stage.</li>
          </ol>
        </div>
      </div>

      <div className="lock-overlay">
        <div className="card lock-card">
          <div className="lock-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <p className="eyebrow">{FREE_REPORTS ? "Free for a limited time" : "Full report"}</p>
          <h3>{FREE_REPORTS ? "Get your full report free" : "Unlock your full report"}</h3>
          <p className="muted lock-sub">
            Every question we asked AI and who it picked, your score over time, who AI recommends instead, your biggest opportunity,
            all your next steps, every fix with where to click and ready-to-paste text, and what to do next.
          </p>
          <a className="button" href={requestHref}>
            {FREE_REPORTS ? "Get my full report free" : "Enquire now"}
          </a>
          <p className="muted small">
            {FREE_REPORTS ? "No payment and no account. In return, we'd love your honest feedback." : "No account needed. We'll reply by email with the details."}
            <br />
            Opens your email app with a message ready to send. Or email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function recheckLink(report) {
  const q = new URLSearchParams({ website: report.shop.domain, sell: report.category || "", recheck: "1" });
  if (report.location) q.set("loc", report.location);
  if (report.extra) q.set("extra", report.extra);
  if (report.subject === "them") q.set("mode", "rival");
  const other = report.h2h ? (report.h2h.youAre === "b" ? report.h2h.b.domain : null) : null;
  if (other) q.set("vs", other);
  for (const c of report.customs || []) q.append("q", c);
  return `/?${q.toString()}`;
}

// One fix, with how long it takes, why it matters and where to click.
function FixItem({ n, text, d }) {
  return (
    <div className="fx-item">
      <div className="fx-top">
        <span className="fx-n">{n}</span>
        <b>{text}</b>
        {d?.effort && <span className="effort">⏱ {d.effort}</span>}
      </div>
      {d?.why && (
        <p className="fx-why">
          <span>Why this matters</span>
          {d.why}
        </p>
      )}
      {d?.how && (
        <p className="fx-how">
          <span>Where to click</span>
          {d.how}
        </p>
      )}
    </div>
  );
}

// "Your next 3 steps": the changes that help most for the least effort.
function NextSteps({ report }) {
  const steps = report.next || [];
  if (!steps.length) return null;
  const more = report.locked ? report.hidden?.next || 0 : 0;
  return (
    <div className="card next3">
      <div className="mini-h">
        <h3>Your next {steps.length + more === 1 ? "step" : `${steps.length + more} steps`}</h3>
        {more > 0 ? <span className="lockchip">{more} more in full report</span> : report.nextTotal ? <span className="muted small">About {report.nextTotal} in total</span> : null}
      </div>
      <div className="n3">
        {steps.map((s, i) => (
          <a className="n3-item" href="#r-fixes" key={i}>
            <span className="fx-n">{i + 1}</span>
            <span className="n3-t">{s.short}</span>
            {s.effort && <span className="effort">⏱ {s.effort}</span>}
          </a>
        ))}
        {Array.from({ length: more }, (_, i) => (
          <div className="n3-item blurred" aria-hidden="true" key={`m${i}`}>
            <span className="fx-n">{steps.length + i + 1}</span>
            <span className="n3-t">A hidden next step for your store</span>
            <span className="effort">⏱ 00 minutes</span>
          </div>
        ))}
      </div>
      <p className="muted small n3-note">
        {more > 0 ? `Your other ${more === 1 ? "step is" : `${more} steps are`} in the full report. ` : ""}Start with the quickest. Each one below shows why it matters and where to click.
      </p>
    </div>
  );
}

function MapBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bars-h">
      {rows.map((r, i) => (
        <div className={`bar${r.you ? " you" : ""}`} key={i}>
          <span className={`bar-name${r.hidden ? " blurred" : ""}`}>{r.label}</span>
          <div className="bar-track">
            <div className="bar-fill grow" style={{ width: `${Math.max(4, (r.value / max) * 100)}%`, animationDelay: `${0.3 + i * 0.07}s` }} />
          </div>
          <span className="bar-num">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Report({ report, onRecheck, clientView = false, access = "" }) {
  const [copied, setCopied] = useState(false);
  // On a report link, only show "Check again" to the person who ran the check (saved on their device), or the owner.
  const [mine, setMine] = useState(false);
  const [h2h, setH2h] = useState(report.h2h || null);
  useEffect(() => setMine(isRecent(report.id) || !report.locked), [report.id, report.locked]);
  useEffect(() => setH2h(report.h2h || null), [report.id, report.h2h]);
  const canRecheck = Boolean(onRecheck) || mine;
  const locked = report.locked;
  const them = report.subject === "them";
  const w = them ? { you: "them", You: "They", your: "their", Your: "Their" } : { you: "you", You: "You", your: "your", Your: "Your" };
  const hidden = report.hidden || {};
  const fixes = report.fixes || [];
  const stats = report.stats || [];
  const link = typeof window !== "undefined" ? `${window.location.origin}/report/${report.id}` : `/report/${report.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const change = report.previous ? { diff: report.overall - report.previous.overall, date: new Date(report.previous.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) } : null;
  const history = report.history || [];

  // "Who AI recommends": names in the full report; bar lengths only in the free one.
  const competitors = report.competitors || [];
  const selfLabel = them ? report.shop.name : "You";
  const mapRows = locked
    ? [...(report.mapCounts || []).map((v) => ({ label: "Hidden store", value: v, hidden: true })), { label: selfLabel, value: report.found || 0, you: true }]
    : [...competitors.slice(0, 5).map((c) => ({ label: c.name, value: c.count })), { label: selfLabel, value: report.youMentions || 0, you: true }];
  mapRows.sort((a, b) => b.value - a.value || (a.you ? 1 : -1));

  const nav = [
    ["r-score", "Score"],
    h2h && ["r-h2h", "Head-to-head"],
    ((locked ? report.searchPreview : report.allSearches) || []).length > 0 && ["r-questions", "Questions"],
    !locked && competitors.length > 0 && ["r-comp", "Competitors"],
    fixes.length > 0 && ["r-fixes", them ? "How to beat them" : "Fixes"],
  ].filter(Boolean);

  return (
    <section id="results" className="results">
      <p className="print-only print-brand">DoesAISeeMyStore · AI visibility report</p>

      {/* 1. Company */}
      <header className="company">
        {(!locked || them) && <p className="eyebrow">{them ? "Competitor check" : "AI visibility report"}</p>}
        <h2 className="company-name">{report.shop.name}</h2>
        <p className="company-meta">
          {report.shop.domain} · {locked ? "Checked " : ""}
          {longDate(report.createdAt)}
          {report.market ? ` · ${report.market}` : ""}
          {report.category ? ` · ${report.category}` : ""}
          {!locked ? " · Prepared by DoesAISeeMyStore" : ""}
        </p>
      </header>

      {nav.length > 2 && (
        <div className="rnav no-print">
          <nav aria-label="Report sections">
            {nav.map(([id, t]) => (
              <a key={id} href={`#${id}`}>
                {t}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* 2. Score dashboard */}
      <div className="dash" id="r-score">
        <div className="card gauge">
          <Gauge value={report.overall} />
          <h2 className="g-label">
            {report.label} <Tip text={TIPS.score} />
          </h2>
          <p className="muted small">{scoreLine(report).replace("recommends you", `recommends ${w.you}`).replace("recommend you", `recommend ${w.you}`)}</p>
          <div className="g-nums">
            <a href="#r-questions">
              <b>
                {report.found ?? 0}
                <small> / {report.checked ?? 0}</small>
              </b>
              <span>searches {them ? "they" : "you"} came up in</span>
            </a>
            <a href="#r-questions">
              <b>{report.topPicks ?? 0}</b>
              <span>times picked first</span>
            </a>
          </div>
          {change && (
            <p className={`change ${change.diff > 0 ? "up" : change.diff < 0 ? "down" : "same"}`}>
              {change.diff > 0 ? `▲ Up ${change.diff}` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)}` : "No change"} since {change.date} (was {report.previous.overall})
            </p>
          )}
        </div>
        <div className="dash-right">
          <div className="card trend">
            <div className="mini-h">
              <b>{w.Your} score over time</b>
              {history.length >= 2 && locked && <span className="lockchip">Full report</span>}
              {history.length >= 2 && !locked && history[history.length - 1].overall - history[0].overall > 0 && (
                <span className="up">▲ +{history[history.length - 1].overall - history[0].overall} since first check</span>
              )}
            </div>
            {history.length >= 2 ? (
              <div className={locked ? "blurred" : ""} aria-hidden={locked ? "true" : undefined}>
                <Trend history={history} />
              </div>
            ) : (
              <p className="muted small">{them ? "Check them again later to see if they're pulling ahead." : "Make some changes, then check again to see your score move here."}</p>
            )}
          </div>
          <div className="card">
            <div className="mini-h">
              <b>Who AI recommends most{report.category ? ` for ${report.category}` : ""}</b>
              {locked && <span className="lockchip">Names in full report</span>}
            </div>
            <MapBars rows={mapRows} />
          </div>
        </div>
      </div>

      {/* Straight after the score: your next 3 steps (1 shown free, 2 blurred) */}
      <NextSteps report={report} />

      {canRecheck && (
        <div className="card recheck-card no-print">
          <div className="recheck">
            <p className="muted small">{change ? "Keep improving and check again to track your progress." : them ? "Check them again any time to see what's changed." : "Made changes to your store? Check again to see your before and after."}</p>
            {onRecheck ? (
              <button type="button" className="secondary" onClick={onRecheck}>
                ↻ Check again
              </button>
            ) : (
              <a className="button secondary-link" href={recheckLink(report)}>
                ↻ Check again
              </a>
            )}
          </div>
        </div>
      )}

      {/* Client's private full report: just the PDF button */}
      {!locked && clientView && (
        <div className="card share no-print">
          <div>
            <b>Your full report</b>
            <p className="muted">Keep this link private. You can save the report as a PDF.</p>
          </div>
          <div className="share-actions">
            <button type="button" className="secondary" onClick={() => window.print()}>
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Owner-only tools */}
      {!locked && !clientView && report.id && (
        <div className="card share no-print">
          <div>
            <b>Full report (owner view)</b>
            <p className="muted">You're seeing everything because you're signed in as the owner.</p>
          </div>
          <div className="share-actions">
            <button type="button" className="secondary" onClick={copy}>
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button type="button" className="secondary" onClick={() => window.print()}>
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Head-to-head */}
      {h2h && <H2HCard h={h2h} />}

      {/* Full: summary */}
      {!locked && (
        <div className="card summary">
          <h3>Summary</h3>
          <p>
            <b>Where {them ? "they stand" : "you stand"}:</b> {scoreLine(report).replace("recommends you", `recommends ${w.you}`).replace("recommend you", `recommend ${w.you}`)}
          </p>
          {report.wrong?.[0] && (
            <p>
              <b>Biggest problem:</b> {report.wrong[0]}
            </p>
          )}
          {fixes[0] && (
            <p>
              <b>{them ? "Best way to beat them:" : "Biggest opportunity:"}</b> {fixes[0]}
            </p>
          )}
        </div>
      )}

      {/* 3. Doing well */}
      {(report.well?.length > 0 || locked) && (
        <div className="card">
          <h3>
            <span className="h-ic good" aria-hidden="true">
              ✓
            </span>
            What {them ? "they're" : "you're"} doing well
          </h3>
          {report.well?.length ? <PointList items={report.well} hidden={hidden.well} locked={locked} kind="good" /> : <p className="muted">Nothing stood out yet, so there's plenty of room to grow.</p>}
        </div>
      )}

      {/* 4. Doing wrong */}
      {(report.wrong?.length > 0 || locked) && (
        <div className="card">
          <h3>
            <span className="h-ic bad" aria-hidden="true">
              !
            </span>
            {them ? "Where they're weak" : "What you're doing wrong"}
          </h3>
          <PointList items={report.wrong || []} hidden={hidden.wrong} locked={locked} kind="bad" />
        </div>
      )}

      {/* 5. Stats and data */}
      {stats.length > 0 && (
        <div className="card">
          <h3>
            <span className="h-ic num" aria-hidden="true">
              #
            </span>
            Stats and data <Tip text={TIPS.stats} />
          </h3>
          <div className="statboxes">
            {stats.map((s, i) => (
              <div className={`statbox${s.hot ? " hot" : ""}`} key={i}>
                <b>{s.big}</b>
                <span>{s.text}</span>
              </div>
            ))}
            {locked &&
              filler(Math.min(2, hidden.stats || 1), (i) => (
                <div className="statbox blurred" aria-hidden="true" key={`hs${i}`}>
                  <b>00</b>
                  <span>A hidden stat about you and your competitors.</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 6. Every question we asked */}
      <QuestionExplorer report={report} />

      {/* Full: competitors, categories, checks */}
      {!locked && competitors.length > 0 && (
        <div className="card" id="r-comp">
          <h3>
            Who AI recommends instead <Tip text={TIPS.map} />
          </h3>
          <MapBars rows={mapRows} />
          <p className="note-sm">Mentions across the searches we tested.</p>
        </div>
      )}

      {!locked && report.categories?.length > 0 && (
        <div className="card">
          <h3>
            Performance by type of search <Tip text={TIPS.categories} />
          </h3>
          <div className="cats">
            {report.categories.map((c, i) => {
              const s = strength(c.pct);
              return (
                <div className="cat" key={i}>
                  <div className="cat-top">
                    <span>{c.name}</span>
                    <span className={`cat-word ${s.cls}`}>{s.word}</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${s.cls}`} style={{ width: `${Math.max(4, c.pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!locked && report.checks && (
        <div className="card">
          <h3>
            What we checked on {w.your} store <Tip text={TIPS.checks} />
          </h3>
          <div className="checks">
            {CHECK_ROWS.filter(([k]) => report.checks[k]).map(([k, name]) => (
              <div className="check-row" key={k}>
                <span className={`check-dot ${report.checks[k].ok ? "ok" : "no"}`} aria-hidden="true">
                  {report.checks[k].ok ? "✓" : "!"}
                </span>
                <span className="check-name">{name}</span>
                <span className="check-text">{report.checks[k].text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Ways to change */}
      {fixes.length > 0 && (
        <div className="card" id="r-fixes">
          <h3>
            <span className="h-ic fix" aria-hidden="true">
              →
            </span>
            {them ? "How to beat them" : "Ways to change"}
          </h3>
          {(report.fixDetails || []).some((d) => d && (d.why || d.how)) ? (
            <div className="fx">
              {fixes.map((f, i) => (
                <FixItem key={i} n={i + 1} text={f} d={report.fixDetails?.[i]} />
              ))}
              {locked &&
                filler(hidden.fixes, (i) => (
                  <div key={`hf${i}`} className="fx-item blurred" aria-hidden="true">
                    <div className="fx-top">
                      <span className="fx-n">{fixes.length + i + 1}</span>
                      <b>Another quick win, short and to the point.</b>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <ol className="fixes">
              {fixes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
              {locked &&
                filler(hidden.fixes, (i) => (
                  <li key={`hf${i}`} className="blurred" aria-hidden="true">
                    Another quick win, short and to the point.
                  </li>
                ))}
            </ol>
          )}
        </div>
      )}

      {/* Full: ready-to-paste text */}
      {!locked && report.snippets?.length > 0 && (
        <div className="card" id="r-snippets">
          <h3>
            Ready-to-paste text <Tip text={TIPS.snippets} />
          </h3>
          <div className="snippets">
            {report.snippets.map((s, i) => (
              <Snippet s={s} key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Full: growth plan */}
      {!locked && report.plan?.length > 0 && (
        <div className="card">
          <h3>What you can do next</h3>
          <div className="plan">
            {report.plan.map((st, i) => (
              <div className="plan-stage" key={i}>
                <span className="plan-when">{st.stage}</span>
                <ul className="points">
                  {st.actions.map((a, j) => (
                    <li key={j}>{a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Unlock (free) */}
      {locked && <LockedBottom report={report} />}

      {!h2h && <H2HBox report={report} access={access} onResult={setH2h} />}

      <div className="card trackc no-print">
        <div>
          <h3>
            Track {w.your} AI visibility<span className="soon">Coming soon</span>
          </h3>
          <p className="muted small">We'll re-run {w.your} searches and {them ? "" : "your own questions "}each month, and email you what changed.</p>
        </div>
        <button type="button" className="secondary" disabled>
          Coming soon
        </button>
      </div>

      {locked ? (
        <EmailReport reportId={report.id} />
      ) : (
        <p className="note report-foot">
          This is a snapshot, not a guarantee. AI answers change over time.
          <br />
          DoesAISeeMyStore · run by {process.env.NEXT_PUBLIC_OWNER_NAME || "Jake"} · {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com"} · Tell us how we did:
          doesaiseemystore.com/feedback
        </p>
      )}
    </section>
  );
}
