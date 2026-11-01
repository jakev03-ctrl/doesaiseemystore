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

function Mark({ value }) {
  if (value === true) return <span className="mark yes" title="Mentioned">✓</span>;
  if (value === false) return <span className="mark no" title="Not mentioned">✕</span>;
  return <span className="mark skip" title="Couldn't check">–</span>;
}

// Placeholder content shown blurred behind the lock. It's made-up filler on purpose:
// the real details are never sent to the browser for locked reports.
function LockedPreview({ report }) {
  const fixes = report.teaser?.fixes || 5;
  const competitors = report.teaser?.competitors || 0;
  const requestHref = `/request?website=${encodeURIComponent(report.shop.domain)}${report.id ? `&report=${report.id}` : ""}`;

  return (
    <div className="locked-wrap">
      <div className="locked-content" aria-hidden="true">
        <div className="card">
          <h3>The searches we tested</h3>
          <div className="table" style={{ "--cols": 1 }}>
            {["Best handmade gifts for someone who has everything", "Where can I buy eco-friendly products in the UK", "Top rated independent shops for quality and value"].map((q, i) => (
              <div className="row" key={i}>
                <span>“{q}”</span>
                <span className="col">
                  <span className="mark skip">?</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid">
          <div className="card">
            <h3>Who AI recommends instead</h3>
            <ol className="comp">
              {["Competitor brand one", "Another store name", "A bigger retailer"].map((c) => (
                <li key={c}>
                  <span>{c}</span>
                  <span className="count">2 mentions</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="card">
            <h3>Your top fixes</h3>
            <ol className="fixes">
              <li>Add clearer details to your product pages so assistants understand them.</li>
              <li>Make delivery and returns information easy to find on every product.</li>
              <li>Describe who each product is for and when it's used.</li>
            </ol>
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
          <ul className="lock-list">
            <li>The real shopper searches we tested, and where you appeared</li>
            <li>
              {competitors > 0 ? `The ${competitors} competitors AI recommends instead of you` : "Who AI recommends instead of you"}
            </li>
            <li>Your top {fixes} fixes, in plain English, ranked by impact</li>
            <li>A clear, step-by-step plan to get recommended more often</li>
          </ul>
          <a className="button" href={requestHref}>
            Enquire now
          </a>
          <p className="muted small">No payment needed to enquire. We'll reply by email with the details.</p>
        </div>
      </div>
    </div>
  );
}

export default function Report({ report, shared = false }) {
  const [copied, setCopied] = useState(false);
  const ais = report.ais || [];
  const link = typeof window !== "undefined" ? `${window.location.origin}/report/${report.id}` : `/report/${report.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const date = new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const change = report.previous
    ? {
        diff: report.overall - report.previous.overall,
        id: report.previous.id,
        date: new Date(report.previous.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
      }
    : null;

  return (
    <section id="results" className="results">
      <p className="print-only print-brand">DoesAISeeMyStore · AI visibility report for {report.shop.domain}</p>

      {/* ---------- Free part ---------- */}
      <div className="card score">
        <Ring value={report.overall} />
        <div className="score-text">
          <p className="eyebrow">{report.shop.name}</p>
          <h2>{report.label}</h2>
          <p>
            {report.visibility > 0 ? (
              <>
                Recommended in <b>{report.visibility}%</b> of the AI shopping searches we tested.
              </>
            ) : (
              <>Not recommended in any of the AI shopping searches we tested.</>
            )}
          </p>
          <p className="tested">
            Tested on {ais.map((a) => a.name).join(" and ")} · {date}
          </p>
          {change && (
            <p className={`change ${change.diff > 0 ? "up" : change.diff < 0 ? "down" : "same"}`}>
              {change.diff > 0 ? `▲ Up ${change.diff} points` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)} points` : "No change"}{" "}
              since the last check on {change.date}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>
          Product info score <span className="pill">{report.dataScore}/100</span>
        </h3>
        <p className="muted">{report.summary}</p>
      </div>

      {/* ---------- Locked or full part ---------- */}
      {report.locked ? (
        <LockedPreview report={report} />
      ) : (
        <>
          {report.id && (
            <div className="card share no-print">
              <div>
                <b>{shared ? "Full report (owner view)" : "Your report link"}</b>
                <p className="muted">You're seeing the full report because you're signed in as the owner.</p>
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

          {ais.length > 1 && (
            <div className="grid">
              {ais.map((a) => (
                <div className="card stat" key={a.id}>
                  <span className="muted">{a.name}</span>
                  <span className="stat-num">{a.pct ?? 0}%</span>
                  <span className="muted">of searches recommended you</span>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3>The searches we tested</h3>
            <p className="muted examples-intro">
              We tested your store against a wide range of realistic shopper searches, the kind of questions
              customers ask AI assistants every day. Here are {report.examples.length} examples:
            </p>
            <div className="table" style={{ "--cols": Math.max(1, ais.length) }}>
              <div className="row head">
                <span>Example search</span>
                {ais.map((a) => (
                  <span key={a.id} className="col">
                    {a.name}
                  </span>
                ))}
              </div>
              {report.examples.map((q, i) => (
                <div className="row" key={i}>
                  <span>“{q.question}”</span>
                  {ais.map((a) => (
                    <span key={a.id} className="col">
                      <Mark value={q.results?.[a.id]} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Who AI recommends instead</h3>
            {report.competitors.length ? (
              <ol className="comp">
                {report.competitors.map((c, i) => (
                  <li key={i}>
                    <span>{c.name}</span>
                    <span className="count">
                      {c.count} {c.count === 1 ? "mention" : "mentions"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No clear competitors came up this time.</p>
            )}
          </div>

          <div className="card">
            <h3>Top fixes</h3>
            <ol className="fixes">
              {report.fixes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ol>
          </div>
        </>
      )}

      <p className="note">
        AI answers change from search to search, so this is a snapshot, not a guarantee. Run it again
        after making changes to see how you improve.
      </p>
    </section>
  );
}
