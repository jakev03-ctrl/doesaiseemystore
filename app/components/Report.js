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

// Placeholder lines shown blurred. They're filler on purpose: the real hidden
// details are never sent to the browser for locked reports.
function BlurredRows({ count, text }) {
  return Array.from({ length: Math.min(count, 3) }, (_, i) => (
    <li key={`b${i}`} className="blurred" aria-hidden="true">
      {text}
    </li>
  ));
}

function LockedBottom({ report }) {
  const requestHref = `/request?website=${encodeURIComponent(report.shop.domain)}${report.id ? `&report=${report.id}` : ""}`;
  return (
    <div className="fadewrap">
      <div className="fade" aria-hidden="true">
        <div className="card">
          <h3>Your step-by-step action plan</h3>
          <ol className="fixes">
            <li>Week one: placeholder text for the first stage of your plan.</li>
            <li>Week two: placeholder text for the second stage of your plan.</li>
            <li>Week three: placeholder text for the third stage of your plan.</li>
          </ol>
        </div>
        <div className="card">
          <h3>Every search we tested</h3>
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
          <ul className="lock-list">
            <li>Every shopper search we tested, and where you appeared</li>
            <li>All the competitors AI recommends instead of you</li>
            <li>All your fixes, ranked by impact</li>
            <li>A step-by-step plan to get recommended more often</li>
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
  const examples = report.examples || [];
  const competitors = report.competitors || [];
  const fixes = report.fixes || [];
  const highlights = report.highlights || [];
  const hidden = report.hidden || { competitors: 0, fixes: 0 };
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

  return (
    <section id="results" className="results">
      <p className="print-only print-brand">DoesAISeeMyStore · AI visibility report for {report.shop.domain}</p>

      {/* 1. Score */}
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
          {change && (
            <p className={`change ${change.diff > 0 ? "up" : change.diff < 0 ? "down" : "same"}`}>
              {change.diff > 0 ? `▲ Up ${change.diff} points` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)} points` : "No change"}{" "}
              since the last check on {change.date}
            </p>
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

      {/* 2. Example searches */}
      <div className="card">
        <h3>The searches we tested</h3>
        <p className="muted examples-intro">
          We tested your store against a wide range of realistic shopper searches. Here are {examples.length} examples:
        </p>
        <div className="table" style={{ "--cols": 1 }}>
          {examples.map((q, i) => (
            <div className="row" key={i}>
              <span>“{q.question}”</span>
              <span className="col">
                <Mark value={Object.values(q.results || {}).some((v) => v === true) ? true : Object.values(q.results || {}).some((v) => v === false) ? false : null} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Competitors + product info */}
      <div className="grid">
        <div className="card">
          <h3>Who AI recommends instead</h3>
          {competitors.length ? (
            <ol className="comp">
              {competitors.map((c, i) => (
                <li key={i}>
                  <span>{c.name}</span>
                  <span className="count">
                    {c.count} {c.count === 1 ? "mention" : "mentions"}
                  </span>
                </li>
              ))}
              {report.locked && <BlurredRows count={hidden.competitors} text="Hidden competitor name" />}
            </ol>
          ) : (
            <p className="muted">No clear competitors came up this time.</p>
          )}
        </div>

        <div className="card">
          <h3>
            Product info score <span className="pill">{report.dataScore}/100</span>
          </h3>
          {highlights.length ? (
            <ul className="points">
              {highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">{report.summary}</p>
          )}
        </div>
      </div>

      {/* 4. Fixes */}
      <div className="card">
        <h3>Your top fixes</h3>
        <ol className="fixes">
          {fixes.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
          {report.locked && <BlurredRows count={hidden.fixes} text="A hidden fix, explained in plain English with what to change." />}
        </ol>
      </div>

      {/* 5. Locked bottom */}
      {report.locked ? (
        <LockedBottom report={report} />
      ) : (
        <p className="note">
          AI answers change from search to search, so this is a snapshot, not a guarantee.
        </p>
      )}
    </section>
  );
}
