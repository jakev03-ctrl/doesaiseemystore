"use client";

import { useState } from "react";

// "Email me my report": sends the visitor a link to their free report.
// Only shown once emails to customers are switched on (NEXT_PUBLIC_EMAIL_REPORTS=1 in Vercel,
// after your domain is verified in Resend).
const ON = process.env.NEXT_PUBLIC_EMAIL_REPORTS === "1";

export default function EmailReport({ reportId }) {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [tips, setTips] = useState(false);
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  if (!ON || !reportId) return null;

  async function send(e) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reportId, agree, tips }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't send that. Please try again.");
      setState("sent");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="card email-report no-print">
        <h3>Sent!</h3>
        <p className="muted">Check your inbox for a link to your report. If it's not there, have a look in your junk folder.</p>
      </div>
    );
  }

  return (
    <form className="card email-report no-print" onSubmit={send}>
      <h3>Email me my report</h3>
      <p className="muted small">Get a link to this report so you can come back to it any time.</p>
      <div className="email-row">
        <input type="email" required placeholder="you@yourstore.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
        <button type="submit" disabled={state === "sending" || !agree}>
          {state === "sending" ? "Sending…" : "Send"}
        </button>
      </div>
      <label className="tick">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
        <span>Yes, email me this report.</span>
      </label>
      <label className="tick">
        <input type="checkbox" checked={tips} onChange={(e) => setTips(e.target.checked)} />
        <span>Also send me occasional tips on getting recommended by AI (optional, unsubscribe any time).</span>
      </label>
      {error && <p className="error">{error}</p>}
      <p className="muted small">
        We only use your email as you've chosen above. See our <a href="/privacy">privacy policy</a>.
      </p>
    </form>
  );
}
