"use client";

import { useState } from "react";

export default function FeedbackForm() {
  const [form, setForm] = useState({ name: "", business: "", email: "", message: "", stars: 0, canShare: false, company_site: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function send(e) {
    e.preventDefault();
    if (!form.stars) return setError("Please choose a star rating.");
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setStatus("sent");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="card cta">
        <h3>Thank you!</h3>
        <p className="muted">Your feedback means a lot and helps us improve.</p>
        <a className="button" href="/">
          Back to the homepage
        </a>
      </div>
    );
  }

  return (
    <form className="card form contact-form" onSubmit={send}>
      <div className="stars-pick" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={form.stars === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`star${n <= form.stars ? " on" : ""}`}
            onClick={() => setForm((f) => ({ ...f, stars: n }))}
          >
            ★
          </button>
        ))}
      </div>
      <label>
        What did you think?
        <textarea value={form.message} onChange={set("message")} required rows={5} maxLength={2000} placeholder="What was useful? What could be better?" />
      </label>
      <label>
        Your name <span className="optional">Optional</span>
        <input type="text" value={form.name} onChange={set("name")} maxLength={80} autoComplete="name" />
      </label>
      <label>
        Your business <span className="optional">Optional</span>
        <input type="text" value={form.business} onChange={set("business")} maxLength={80} />
      </label>
      <label>
        Your email <span className="optional">Optional</span>
        <input type="email" value={form.email} onChange={set("email")} maxLength={120} autoComplete="email" />
        <span className="hint">Only if you're happy for us to reply.</span>
      </label>
      <label className="tick">
        <input type="checkbox" checked={form.canShare} onChange={set("canShare")} />
        <span>
          You can show my review on your website, with my name and business if I've given them. It will be labelled
          "Received a free full report".
        </span>
      </label>
      <input type="text" className="hp" tabIndex={-1} autoComplete="off" value={form.company_site} onChange={set("company_site")} aria-hidden="true" />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
