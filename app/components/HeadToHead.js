"use client";

import { useState } from "react";

// Head-to-head: two shops on the same shopper searches.
function List({ items, total, locked }) {
  if (!total) return <p className="muted small">None</p>;
  return (
    <ul>
      {items.slice(0, 4).map((q, i) => (
        <li key={i}>{q}</li>
      ))}
      {total > Math.min(4, items.length) && <li className="muted">+{total - Math.min(4, items.length)} more{locked ? " in the full report" : ""}</li>}
    </ul>
  );
}

const Mark = ({ v }) => (v === null || v === undefined ? <span className="u">?</span> : v ? <span className="y">✓</span> : <span className="n">✕</span>);

export function H2HCard({ h }) {
  if (!h) return null;
  const youA = h.youAre !== "b";
  const you = youA ? h.a : h.b;
  const them = youA ? h.b : h.a;
  const c = h.counts || { aWins: h.aWins.length, bWins: h.bWins.length, both: h.both.length };
  const youWin = youA ? { items: h.aWins, n: c.aWins } : { items: h.bWins, n: c.bWins };
  const theyWin = youA ? { items: h.bWins, n: c.bWins } : { items: h.aWins, n: c.aWins };
  return (
    <div className="card" id="r-h2h">
      <h3>Head-to-head</h3>
      <div className="h2h-top">
        <div className="h2h-side me">
          <div className="who">You</div>
          <div className="nm">{you.domain}</div>
          <div className="sc">
            {you.found}
            <small>/{you.checked}</small>
          </div>
          <small>searches where AI recommended you</small>
        </div>
        <div className="h2h-vs">vs</div>
        <div className="h2h-side them">
          <div className="who">Competitor</div>
          <div className="nm">{them.domain}</div>
          <div className="sc">
            {them.found}
            <small>/{them.checked}</small>
          </div>
          <small>searches where AI recommended them</small>
        </div>
      </div>
      <div className="h2h-cols">
        <div className="h2h-col w">
          <h4>You win ({youWin.n})</h4>
          <List items={youWin.items} total={youWin.n} locked={h.locked} />
        </div>
        <div className="h2h-col l">
          <h4>They win ({theyWin.n})</h4>
          <List items={theyWin.items} total={theyWin.n} locked={h.locked} />
        </div>
        <div className="h2h-col b">
          <h4>Both shown ({c.both})</h4>
          <List items={h.both} total={c.both} locked={h.locked} />
        </div>
      </div>
      <div className="h2h-have">
        <h4>What AI looks for</h4>
        <div className="have">
          <span className="hd">On the website</span>
          <span className="hd">You</span>
          <span className="hd">Them</span>
          {h.have.map((r) => (
            <span key={r.label} style={{ display: "contents" }}>
              <span>{r.label}</span>
              <Mark v={youA ? r.a : r.b} />
              <Mark v={youA ? r.b : r.a} />
            </span>
          ))}
        </div>
      </div>
      <p className="note-sm">Both stores on the same {you.checked} shopper searches. We only read public pages and respect each site's robots.txt.</p>
    </div>
  );
}

export function H2HBox({ report, access, onResult }) {
  const them = report.subject === "them";
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!report.explorer) return null; // reports from before this feature can't be compared this way

  async function go(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/h2h", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, rival: url, access }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't compare these stores. Please try again.");
      onResult(data.h2h);
      setTimeout(() => document.getElementById("r-h2h")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card compare-box no-print" onSubmit={go}>
      <div>
        <h3>Compare head-to-head</h3>
        <p className="muted small">
          {them
            ? "Add your own store to see which of these searches each of you wins, and why."
            : "Add a competitor to see which of these searches each of you wins, and why."}{" "}
          It uses the same searches, so it doesn't use a free check.
        </p>
      </div>
      <div className="email-row">
        <input
          type="text"
          inputMode="url"
          placeholder={them ? "e.g. mystore.co.uk" : "e.g. rivalstore.co.uk"}
          aria-label={them ? "Your store's website" : "Competitor's website"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Comparing…" : "Compare"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
