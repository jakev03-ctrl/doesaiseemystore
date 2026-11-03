"use client";

import { useState } from "react";

function Ring({ value }) {
  const colour = value >= 70 ? "var(--good)" : value >= 40 ? "var(--mid)" : "var(--bad)";
  return (
    <div className="ring" style={{ "--v": value, "--c": colour }}>
      <div className="ring-inner">
        <span className="ring-num">{value}</span>
        <span className="ring-of">/100</span>
      </div>
    </div>
  );
}

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
          <p className="eyebrow">Full report</p>
          <h3>Unlock your full report</h3>
          <p className="muted lock-sub">
            Every search we tested and your position in each, your full competitive map, every category, all your
            quick wins and a step-by-step growth plan.
          </p>
          <a className="button" href={requestHref}>
            Enquire now
          </a>
          <p className="muted small">No account needed. We'll reply by email with the details.</p>
        </div>
      </div>
    </div>
  );
}

export default function Report({ report }) {
  const [copied, setCopied] = useState(false);
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
          <h2>{report.label}</h2>
          <p>{encouragement(report)}</p>
          {change && (
            <p className={`change ${change.diff > 0 ? "up" : change.diff < 0 ? "down" : "same"}`}>
              {change.diff > 0 ? `▲ Up ${change.diff} points` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)} points` : "No change"}{" "}
              since the last check on {change.date}
            </p>
          )}
        </div>
        <div className="kpis">
          <div className="kpi">
            <b>{report.visibility}%</b>
            <span>Searches you appeared in</span>
          </div>
          {report.topPicks !== null && (
            <div className="kpi">
              <b>{report.topPicks}</b>
              <span>{report.topPicks === 1 ? "Top pick" : "Top picks"}</span>
            </div>
          )}
          {report.rank ? (
            <div className="kpi">
              <b>{ordinal(report.rank.position)}</b>
              <span>Of {report.rank.of} shops recommended</span>
            </div>
          ) : (
            report.market && (
              <div className="kpi">
                <b className="kpi-text">{report.market}</b>
                <span>Market tested</span>
              </div>
            )
          )}
        </div>
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
              Save as PDF
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
          <h3>How often AI recommends you vs competitors</h3>
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
          <h3>Performance by category</h3>
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
          Product info score <span className="pill">{report.dataScore}/100</span>
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
        <LockedBottom report={report} />
      ) : (
        <p className="note">AI answers change from search to search, so this is a snapshot, not a guarantee.</p>
      )}
    </section>
  );
}
