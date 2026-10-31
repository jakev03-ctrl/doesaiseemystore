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

export default function Report({ report, shared = false }) {
  const [copied, setCopied] = useState(false);
  const ais = report.ais || [];
  const examples = report.examples || (report.questions || []).slice(0, 3);
  const link = typeof window !== "undefined" ? `${window.location.origin}/report/${report.id}` : `/report/${report.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const date = new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section id="results" className="results">
      <div className="card score">
        <Ring value={report.overall} />
        <div className="score-text">
          <p className="eyebrow">{report.shop.name}</p>
          <h2>{report.label}</h2>
          <p>
            Mentioned in <b>{report.found}</b> of <b>{report.checked}</b> AI shopping searches.
          </p>
          <p className="tested">
            Tested on {ais.map((a) => a.name).join(" and ")} · {date}
          </p>
        </div>
      </div>

      {report.id && (
        <div className="card share">
          <div>
            <b>{shared ? "Share this report" : "Your report link"}</b>
            <p className="muted">Send it to a partner or save it to compare after you make changes.</p>
          </div>
          <button type="button" className="secondary" onClick={copy}>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}

      {ais.length > 1 && (
        <div className="grid">
          {ais.map((a) => (
            <div className="card stat" key={a.id}>
              <span className="muted">{a.name}</span>
              <span className="stat-num">
                {a.found}/{a.checked}
              </span>
              <span className="muted">searches mentioned you</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>
          We tested {report.questionCount ?? examples.length} shopper searches
        </h3>
        <p className="muted examples-intro">
          Real questions a shopper might ask an AI assistant. Here are {examples.length} of them:
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
          {examples.map((q, i) => (
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

      <div className="grid">
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
          <h3>
            Product info score <span className="pill">{report.dataScore}/100</span>
          </h3>
          <p className="muted">{report.summary}</p>
        </div>
      </div>

      <div className="card">
        <h3>Your top fixes</h3>
        <ol className="fixes">
          {report.fixes.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ol>
      </div>

      <p className="note">
        AI answers change from search to search, so this is a snapshot, not a guarantee. Run it again
        after making changes to see how you improve.
      </p>
    </section>
  );
}
