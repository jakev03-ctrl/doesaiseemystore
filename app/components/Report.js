"use client";

import { useEffect, useState } from "react";
import { isRecent } from "./recent";
import EmailReport from "./EmailReport";

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
      <button
        type="button"
        className="tip-btn"
        aria-label="What does this mean?"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      >
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
  visibility: "The share of realistic shopper searches where AI mentioned your store.",
  topPick: "Searches where you were the very first shop AI recommended. Shoppers often go with the first suggestion.",
  rank: "Where you place among all the shops AI recommended, based on how often each one was mentioned.",
  market: "The country or area we searched from, so the results match what shoppers there would see.",
  map: "How many of our searches each shop was recommended in. More mentions means AI trusts that shop more for what you sell.",
  categories: "How often you were recommended for each type of search, like price, quality or gift searches.",
  product: "How clear and complete your product details are for AI: descriptions, sizes, materials, prices, delivery and returns.",
  checks: "Things we checked directly on your website, so you know exactly what's already in place.",
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

function encouragement(report) {
  if (report.topPicks > 0) return "AI is already putting you first for some searches. Let's build on that.";
  if (report.visibility >= 40) return "You're already being recommended, and there's room to grow.";
  if (report.visibility > 0) return "AI has started to notice you. A few changes could make a real difference.";
  return "AI isn't recommending you yet, which means there's a whole channel still to open up.";
}

// Placeholder content shown blurred. It's filler on purpose: the real hidden
// details are never sent to the browser for locked reports.
function BlurredItems({ count, render }) {
  return Array.from({ length: Math.min(count, 4) }, (_, i) => render(i));
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

function LockedBottom({ report }) {
  const requestHref = `/request?website=${encodeURIComponent(report.shop.domain)}${report.id ? `&report=${report.id}` : ""}`;
  return (
    <div className="fadewrap">
      <div className="fade" aria-hidden="true">
        <div className="card">
          <h3>Your step-by-step growth plan</h3>
          <ol className="fixes">
            <li>Week one: placeholder text for the first stage of your plan.</li>
            <li>Week two: placeholder text for the second stage of your plan.</li>
            <li>Week three: placeholder text for the third stage of your plan.</li>
          </ol>
        </div>
        <div className="card">
          <h3>Every search, with your position</h3>
          <div className="table" style={{ "--cols": 1 }}>
            {["Placeholder search question number four", "Placeholder search question number five", "Placeholder search question number six"].map((q) => (
              <div className="row" key={q}>
                <span>“{q}”</span>
                <span className="col">
                  <span className="mark skip">?</span>
                </span>
              </div>
            ))}
          </div>
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
            Every search we tested and your position in each, your full competitive map, every category, all your
            quick wins and a step-by-step growth plan.
          </p>
          <a className="button" href={requestHref}>
            {FREE_REPORTS ? "Get my full report free" : "Enquire now"}
          </a>
          <p className="muted small">
            {FREE_REPORTS
              ? "No payment and no account. In return, we'd love your honest feedback."
              : "No account needed. We'll reply by email with the details."}
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

export default function Report({ report, onRecheck }) {
  const [copied, setCopied] = useState(false);
  // On a report link, only show "Check again" to the person who ran the check (saved on their device), or the owner.
  const [mine, setMine] = useState(false);
  useEffect(() => setMine(isRecent(report.id) || !report.locked), [report.id, report.locked]);
  const canRecheck = Boolean(onRecheck) || mine;
  const examples = report.examples || [];
  const wins = examples.filter((q) => q.found);
  const missed = examples.filter((q) => !q.found);
  const competitors = report.competitors || [];
  const categories = report.categories || [];
  const fixes = report.fixes || [];
  const highlights = report.highlights || [];
  const hidden = report.hidden || {};
  const link = typeof window !== "undefined" ? `${window.location.origin}/report/${report.id}` : `/report/${report.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const change = report.previous
    ? {
        diff: report.overall - report.previous.overall,
        date: new Date(report.previous.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
      }
    : null;

  const mapMax = Math.max(report.youMentions || 0, ...competitors.map((c) => c.count), 1);
  const mapRows = [
    ...competitors.map((c) => ({ label: c.name, value: c.count, you: false })),
    { label: "You", value: report.youMentions || 0, you: true },
  ].sort((a, b) => b.value - a.value || (a.you ? 1 : -1));

  return (
    <section id="results" className="results">
      <p className="print-only print-brand">DoesAISeeMyStore · AI visibility report for {report.shop.domain}</p>

      {/* 1. Overall performance */}
      <div className="card score">
        <Ring value={report.overall} />
        <div className="score-text">
          <p className="eyebrow">{report.shop.name}</p>
          <h2>
            {report.label} <Tip text={TIPS.score} />
          </h2>
          <p>{encouragement(report)}</p>
          {change && (
            <p className={`change ${change.diff > 0 ? "up" : change.diff < 0 ? "down" : "same"}`}>
              <span className="before-after">
                Before <b>{report.previous.overall}</b> → Now <b>{report.overall}</b>
              </span>{" "}
              {change.diff > 0 ? `▲ Up ${change.diff} points` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)} points` : "No change"}{" "}
              since your last check on {change.date}
            </p>
          )}
        </div>
        <div className="kpis">
          <div className="kpi">
            <b>{report.visibility}%</b>
            <span>
              Searches you appeared in <Tip text={TIPS.visibility} />
            </span>
          </div>
          {report.topPicks !== null && (
            <div className="kpi">
              <b>{report.topPicks}</b>
              <span>
                {report.topPicks === 1 ? "Top pick" : "Top picks"} <Tip text={TIPS.topPick} />
              </span>
            </div>
          )}
          {report.rank ? (
            <div className="kpi">
              <b>
                {report.rank.joint ? "Joint " : ""}
                {ordinal(report.rank.position)}
              </b>
              <span>
                Of {report.rank.of} shops recommended <Tip text={TIPS.rank} />
              </span>
            </div>
          ) : (
            report.market && (
              <div className="kpi">
                <b className="kpi-text">{report.market}</b>
                <span>
                  Market tested <Tip text={TIPS.market} />
                </span>
              </div>
            )
          )}
        </div>
        {canRecheck && (
          <div className="recheck no-print">
            <p className="muted small">
              {change ? "Keep improving and check again to track your progress." : "Made changes to your store? Check again to see your before and after."}
            </p>
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

      {/* Owner-only tools */}
      {!report.locked && report.id && (
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

      {/* 2. Wins */}
      {wins.length > 0 && (
        <div className="card wins">
          <h3>Where you're winning</h3>
          <div className="table" style={{ "--cols": 1 }}>
            {wins.map((q, i) => (
              <div className="row" key={i}>
                <span>“{q.question}”</span>
                <span className="col">{q.topPick ? <span className="badge gold">★ Top pick</span> : <span className="badge green">✓ Recommended</span>}</span>
              </div>
            ))}
          </div>
          {wins.some((q) => q.topPick) && (
            <p className="note-sm">A top pick means you were the first shop AI recommended. Shoppers often go with the first suggestion.</p>
          )}
        </div>
      )}

      {/* 3. Missed */}
      {missed.length > 0 && (
        <div className="card">
          <h3>{wins.length ? "Searches you missed" : "The searches we tested"}</h3>
          {!wins.length && (
            <p className="muted examples-intro">We tested your store against a wide range of realistic shopper searches. Here are a few examples:</p>
          )}
          <div className="table" style={{ "--cols": 1 }}>
            {missed.map((q, i) => (
              <div className="row" key={i}>
                <span>“{q.question}”</span>
                <span className="col">
                  <span className="badge red">Not mentioned</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Competitive map */}
      {competitors.length > 0 && (
        <div className="card">
          <h3>
            How often AI recommends you vs competitors <Tip text={TIPS.map} />
          </h3>
          <div className="bars-h">
            {mapRows.map((r, i) => (
              <Bar key={i} label={r.label} value={r.value} max={mapMax} you={r.you} />
            ))}
            {report.locked && (
              <BlurredItems
                count={hidden.competitors || 0}
                render={(i) => (
                  <div className="blurred" aria-hidden="true" key={`hc${i}`}>
                    <Bar label="Hidden competitor" value={1} max={mapMax} />
                  </div>
                )}
              />
            )}
          </div>
          <p className="note-sm">Mentions across the searches we tested{report.locked ? ". Full map in the in-depth report." : "."}</p>
        </div>
      )}

      {/* 5. Categories */}
      {categories.length > 0 && (
        <div className="card">
          <h3>
            Performance by category <Tip text={TIPS.categories} />
          </h3>
          <div className="cats">
            {categories.map((c, i) => {
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
            {report.locked && (
              <BlurredItems
                count={hidden.categories || 0}
                render={(i) => (
                  <div className="cat blurred" aria-hidden="true" key={`hcat${i}`}>
                    <div className="cat-top">
                      <span>Hidden category</span>
                      <span>Hidden</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: "30%" }} />
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      )}

      {/* 6. Product info */}
      <div className="card">
        <h3>
          Product info score <span className="pill">{report.dataScore}/100</span> <Tip text={TIPS.product} />
        </h3>
        {highlights.length ? (
          <ul className="points">
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
            {report.locked && (
              <BlurredItems
                count={hidden.highlights || 0}
                render={(i) => (
                  <li key={`hh${i}`} className="blurred" aria-hidden="true">
                    A hidden point about your product information.
                  </li>
                )}
              />
            )}
          </ul>
        ) : (
          <>
            <p className="muted">{report.summary}</p>
            {report.locked && (
              <p className="muted blurred" aria-hidden="true">
                More detail about your product information is included in the full report.
              </p>
            )}
          </>
        )}
      </div>

      {/* 6b. What we checked */}
      {report.checks && (
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

      {/* 7. Quick wins */}
      {fixes.length > 0 && (
        <div className="card">
          <h3>{report.locked ? "Your quickest win" : "Your quick wins"}</h3>
          <ol className="fixes">
            {fixes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
            {report.locked && (
              <BlurredItems
                count={hidden.fixes || 0}
                render={(i) => (
                  <li key={`hf${i}`} className="blurred" aria-hidden="true">
                    Another quick win, explained in plain English with what to change.
                  </li>
                )}
              />
            )}
          </ol>
        </div>
      )}

      {/* Full view: growth plan */}
      {!report.locked && report.plan?.length > 0 && (
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

      {/* Owner: every search */}
      {!report.locked && report.allSearches?.length > 0 && (
        <div className="card">
          <h3>Every search, with your position</h3>
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

      {/* 8. Locked bottom */}
      {report.locked ? (
        <>
          <LockedBottom report={report} />
          <EmailReport reportId={report.id} />
        </>
      ) : (
        <p className="note">AI answers change from search to search, so this is a snapshot, not a guarantee.</p>
      )}
    </section>
  );
}
