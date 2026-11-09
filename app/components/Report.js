"use client";

import { useEffect, useState } from "react";
import { isRecent } from "./recent";
import EmailReport from "./EmailReport";
import CompareBox from "./CompareBox";

// While full reports are free (to collect reviews). Set NEXT_PUBLIC_FREE_REPORTS=0 in Vercel to switch off.
const FREE_REPORTS = process.env.NEXT_PUBLIC_FREE_REPORTS !== "0";

// The score ring fills and the number counts up from 0.
function Ring({ value }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1400);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => (frame = requestAnimationFrame(tick)), 250);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(frame);
    };
  }, [value]);
  const colour = value >= 70 ? "var(--good)" : value >= 40 ? "var(--mid)" : "var(--bad)";
  return (
    <div className="ring" style={{ "--v": shown, "--c": colour }} aria-label={`Score ${value} out of 100`}>
      <div className="ring-inner">
        <span className="ring-num">{shown}</span>
        <span className="ring-of">/100</span>
      </div>
    </div>
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
  map: "How many of our searches each shop was recommended in. More mentions means AI trusts that shop more for what you sell.",
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

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

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
function History({ history }) {
  if (!history || history.length < 2) return null;
  const w = 320;
  const h = 70;
  const pts = history.map((p, i) => [12 + (i * (w - 24)) / (history.length - 1), h - 10 - (p.overall / 100) * (h - 24)]);
  return (
    <div className="history">
      <span className="history-label">Your score over time</span>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`Scores: ${history.map((p) => p.overall).join(", ")}`}>
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="var(--accent)" />
            <text x={x} y={y - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--soft)">
              {history[i].overall}
            </text>
          </g>
        ))}
      </svg>
    </div>
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
          <h3>Your step-by-step growth plan</h3>
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
            Every point, every stat, every search we tested, who AI recommends instead, all your fixes with ready-to-paste text, and a
            step-by-step growth plan.
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
  return `/?${q.toString()}`;
}

export default function Report({ report, onRecheck, clientView = false }) {
  const [copied, setCopied] = useState(false);
  // On a report link, only show "Check again" to the person who ran the check (saved on their device), or the owner.
  const [mine, setMine] = useState(false);
  useEffect(() => setMine(isRecent(report.id) || !report.locked), [report.id, report.locked]);
  const canRecheck = Boolean(onRecheck) || mine;
  const locked = report.locked;
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

  const competitors = report.competitors || [];
  const mapMax = Math.max(report.youMentions || 0, ...competitors.map((c) => c.count), 1);
  const mapRows = [...competitors.map((c) => ({ label: c.name, value: c.count, you: false })), { label: "You", value: report.youMentions || 0, you: true }].sort(
    (a, b) => b.value - a.value || (a.you ? 1 : -1)
  );

  return (
    <section id="results" className="results">
      <p className="print-only print-brand">DoesAISeeMyStore · AI visibility report</p>

      {/* 1. Company */}
      <header className="company">
        {!locked && <p className="eyebrow">AI visibility report</p>}
        <h2 className="company-name">{report.shop.name}</h2>
        <p className="company-meta">
          {report.shop.domain} · {locked ? "Checked " : ""}
          {longDate(report.createdAt)}
          {report.market ? ` · ${report.market}` : ""}
          {!locked ? " · Prepared by DoesAISeeMyStore" : ""}
        </p>
      </header>

      {/* 2. Score */}
      <div className="card score">
        <Ring value={report.overall} />
        <div className="score-text">
          <h2>
            {report.label} <Tip text={TIPS.score} />
          </h2>
          <p>{scoreLine(report)}</p>
          {change && (
            <p className={`change ${change.diff > 0 ? "up" : change.diff < 0 ? "down" : "same"}`}>
              <span className="before-after">
                Before <b>{report.previous.overall}</b> → Now <b>{report.overall}</b>
              </span>{" "}
              {change.diff > 0 ? `▲ Up ${change.diff} points` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)} points` : "No change"} since your last check on {change.date}
            </p>
          )}
        </div>
        <History history={report.history} />
        {canRecheck && (
          <div className="recheck no-print">
            <p className="muted small">{change ? "Keep improving and check again to track your progress." : "Made changes to your store? Check again to see your before and after."}</p>
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
        )}
      </div>

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

      {/* Full: summary */}
      {!locked && (
        <div className="card summary">
          <h3>Summary</h3>
          <p>
            <b>Where you stand:</b> {scoreLine(report)}
          </p>
          {report.wrong?.[0] && (
            <p>
              <b>Biggest problem:</b> {report.wrong[0]}
            </p>
          )}
          {fixes[0] && (
            <p>
              <b>Biggest opportunity:</b> {fixes[0]}
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
            What you're doing well
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
            What you're doing wrong
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

      {/* Full: competitors, categories, every search, checks */}
      {!locked && competitors.length > 0 && (
        <div className="card">
          <h3>
            Who AI recommends instead <Tip text={TIPS.map} />
          </h3>
          <div className="bars-h">
            {mapRows.map((r, i) => (
              <Bar key={i} label={r.label} value={r.value} max={mapMax} you={r.you} />
            ))}
          </div>
          <p className="note-sm">Mentions across the searches we tested.</p>
        </div>
      )}

      {!locked && report.categories?.length > 0 && (
        <div className="card">
          <h3>
            Performance by category <Tip text={TIPS.categories} />
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

      {!locked && report.allSearches?.length > 0 && (
        <div className="card">
          <h3>Every search we tested</h3>
          <div className="table" style={{ "--cols": 1 }}>
            {report.allSearches.map((q, i) => (
              <div className="row" key={i}>
                <span>
                  “{q.question}”{q.category && <span className="count"> · {q.category}</span>}
                </span>
                <span className="col">
                  {q.position === 1 ? (
                    <span className="badge gold">★ 1st</span>
                  ) : q.position ? (
                    <span className="badge green">{ordinal(q.position)}</span>
                  ) : q.found ? (
                    <span className="badge green">✓</span>
                  ) : (
                    <span className="badge red">Not mentioned</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!locked && report.checks && (
        <div className="card">
          <h3>
            What we checked on your store <Tip text={TIPS.checks} />
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

      {/* 6. Ways to change */}
      {fixes.length > 0 && (
        <div className="card">
          <h3>
            <span className="h-ic fix" aria-hidden="true">
              →
            </span>
            Ways to change
          </h3>
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
        </div>
      )}

      {/* Full: ready-to-paste text */}
      {!locked && report.snippets?.length > 0 && (
        <div className="card">
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
          <h3>Your step-by-step growth plan</h3>
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

      {/* 7. Unlock (free) / footer (full) */}
      {locked ? (
        <>
          <LockedBottom report={report} />
          <CompareBox report={report} />
          <EmailReport reportId={report.id} />
        </>
      ) : (
        <>
          <CompareBox report={report} />
          <p className="note report-foot">
            This is a snapshot, not a guarantee. AI answers change over time.
            <br />
            DoesAISeeMyStore · run by {process.env.NEXT_PUBLIC_OWNER_NAME || "Jake"} · {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com"} · Tell us how we did:
            doesaiseemystore.com/feedback
          </p>
        </>
      )}
    </section>
  );
}
