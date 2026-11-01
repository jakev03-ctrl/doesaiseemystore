// Emails you (via Resend) whenever someone sends a message or report request.
// Needs RESEND_API_KEY in Vercel. Without it, enquiries still go to your /admin inbox.
const esc = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function notifyOwner(entry) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.NOTIFY_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";
  const from = process.env.NOTIFY_FROM || "DoesAISeeMyStore <onboarding@resend.dev>";
  const site = process.env.SITE_URL || "https://www.doesaiseemystore.com";

  const isReport = entry.type === "report";
  const who = entry.business || entry.name || entry.email;
  const subject = isReport ? `New in-depth report request: ${who}` : `New message from ${who}`;

  const rows = isReport
    ? [
        ["Business", entry.business],
        ["Website", entry.website],
        ["Email", entry.email],
        ["What they do", entry.message],
      ]
    : [
        ["Name", entry.name || "Not given"],
        ["Email", entry.email],
        ["Message", entry.message],
      ];

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px">
    <h2 style="margin:0 0 16px">${esc(subject)}</h2>
    ${rows
      .map(
        ([k, v]) =>
          `<p style="margin:0 0 12px"><b>${esc(k)}:</b><br>${esc(v).replace(/\n/g, "<br>")}</p>`
      )
      .join("")}
    ${isReport && entry.reportId ? `<p><a href="${site}/report/${esc(entry.reportId)}">View their free report</a></p>` : ""}
    <p style="color:#666;font-size:13px">Press Reply to answer them directly. Also saved in your inbox at ${site}/admin</p>
  </div>`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n\n") + `\n\nReply to this email to answer them directly.`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: entry.email, subject, html, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("Email notification failed:", res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error("Email notification failed:", e?.message);
  }
}
