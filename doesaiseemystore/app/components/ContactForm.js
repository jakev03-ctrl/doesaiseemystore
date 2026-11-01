"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "", company_site: "" });
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
        <h3>Thanks, message sent!</h3>
        <p className="muted">We'll reply to {form.email} as soon as we can.</p>
        <a className="button" href="/">
          Back to the homepage
        </a>
      </div>
    );
  }

  return (
    <form className="card form contact-form" onSubmit={send}>
      <label>
        Your name <span className="optional">Optional</span>
        <input type="text" value={form.name} onChange={set("name")} maxLength={80} autoComplete="name" />
      </label>
      <label>
        Your email
        <input type="email" value={form.email} onChange={set("email")} required maxLength={120} autoComplete="email" />
      </label>
      <label>
        Message
        <textarea value={form.message} onChange={set("message")} required rows={6} maxLength={3000} />
      </label>
      <label className="hp" aria-hidden="true">
        Company site
        <input type="text" tabIndex={-1} autoComplete="off" value={form.company_site} onChange={set("company_site")} />
      </label>
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
