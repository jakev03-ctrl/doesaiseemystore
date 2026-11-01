"use client";

import { useState } from "react";

export default function RequestForm({ website = "", reportId = "" }) {
  const [form, setForm] = useState({ business: "", website, email: "", message: "", company_site: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function send(e) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "report", reportId }),
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
        <h3>Request received!</h3>
        <p className="muted">
          Thanks, {form.business}. We'll be in touch at {form.email} about your in-depth report.
        </p>
        <a className="button" href="/">
          Back to the homepage
        </a>
      </div>
    );
  }

  return (
    <form className="card form contact-form" onSubmit={send}>
      <label>
        Business name
        <input type="text" value={form.business} onChange={set("business")} required maxLength={100} autoComplete="organization" />
      </label>
      <label>
        Website
        <input type="text" inputMode="url" value={form.website} onChange={set("website")} required maxLength={200} placeholder="e.g. mystore.co.uk" />
      </label>
      <label>
        What does your business do?
        <textarea
          value={form.message}
          onChange={set("message")}
          required
          rows={5}
          maxLength={3000}
          placeholder="A brief description: what you sell, who your customers are, and anything you'd like the report to focus on."
        />
      </label>
      <label>
        Your email
        <input type="email" value={form.email} onChange={set("email")} required maxLength={120} autoComplete="email" />
        <span className="hint">So we can send your report and get in touch.</span>
      </label>
      <label className="hp" aria-hidden="true">
        Company site
        <input type="text" tabIndex={-1} autoComplete="off" value={form.company_site} onChange={set("company_site")} />
      </label>
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Request my in-depth report"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
