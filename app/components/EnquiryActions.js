"use client";

import { useState } from "react";

const LABELS = { new: "New", sent: "Report sent", feedback: "Feedback received", done: "Done" };

// Admin inbox: status and "Send report" for one enquiry.
export default function EnquiryActions({ enquiry, initial }) {
  const [status, setStatus] = useState(initial?.status || "new");
  const [link, setLink] = useState(initial?.link || "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function post(body) {
    const res = await fetch("/api/admin/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: enquiry.key, ...body }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function change(e) {
    const next = e.target.value;
    setStatus(next);
    try {
      await post({ status: next });
    } catch (err) {
      setNote(err.message);
    }
  }

  async function send() {
    setBusy(true);
    setNote("");
    try {
      const data = await post({ send: true, reportId: enquiry.reportId, email: enquiry.email, name: enquiry.name || enquiry.business, website: enquiry.website });
      setStatus("sent");
      setLink(data.link);
      if (data.sent) setNote("Sent! The report and feedback link are on their way.");
      else {
        setNote("Your email app is opening with the message ready. Just press Send.");
        window.location.href = data.mailto;
      }
    } catch (err) {
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="enq">
      <select value={status} onChange={change} aria-label="Status">
        {Object.entries(LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {enquiry.reportId && (
        <>
          <a className="button secondary-link small-btn" href={`/report/${enquiry.reportId}`} target="_blank" rel="noreferrer">
            Open full report
          </a>
          <button type="button" className="small-btn" onClick={send} disabled={busy}>
            {busy ? "Preparing…" : status === "sent" ? "Send again" : "Send report"}
          </button>
        </>
      )}
      {link && (
        <span className="muted small enq-link">
          Client link: <a href={link}>{link.replace(/^https?:\/\//, "").slice(0, 48)}…</a>
        </span>
      )}
      {note && <span className="muted small">{note}</span>}
    </div>
  );
}
