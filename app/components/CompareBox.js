"use client";

import { useState } from "react";
import { runScanJob } from "./scanClient";

// "Compare with a competitor": checks a rival's store the same way, then shows both side by side.
export default function CompareBox({ report }) {
  const [rival, setRival] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  async function go(e) {
    e.preventDefault();
    setError("");
    setState("running");
    try {
      const other = await runScanJob(
        { url: rival, category: report.category, location: report.location || "", extra: report.extra || "" },
        { remember: false }
      );
      window.location.href = `/compare/${report.id}/${other.id}`;
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  }

  return (
    <form className="card compare-box no-print" onSubmit={go}>
      <div>
        <h3>Compare with a competitor</h3>
        <p className="muted small">See how a rival scores for the same searches, side by side. Uses one of your free checks.</p>
      </div>
      <div className="email-row">
        <input type="text" inputMode="url" placeholder="e.g. rivalstore.co.uk" value={rival} onChange={(e) => setRival(e.target.value)} required disabled={state === "running"} />
        <button type="submit" disabled={state === "running"}>
          {state === "running" ? "Checking…" : "Compare"}
        </button>
      </div>
      {state === "running" && <p className="muted small">Checking your competitor. This takes about as long as your own check.</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
