export const metadata = { title: "Back soon | DoesAISeeMyStore", robots: { index: false } };

export default function Maintenance() {
  return (
    <main className="wrap narrow" style={{ minHeight: "80vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <p className="kicker" style={{ letterSpacing: ".12em", textTransform: "uppercase", fontSize: 13, opacity: 0.7 }}>DoesAISeeMyStore</p>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 52px)", margin: "10px 0 14px" }}>We're making it better</h1>
        <p style={{ fontSize: 18, opacity: 0.85, maxWidth: 520, margin: "0 auto 22px", lineHeight: 1.5 }}>
          The free AI visibility check is taking a short break while we improve how it tests stores. Please check back soon.
        </p>
        <p style={{ opacity: 0.75 }}>
          Questions? <a href="mailto:hello@doesaiseemystore.com">hello@doesaiseemystore.com</a>
        </p>
      </div>
    </main>
  );
}
