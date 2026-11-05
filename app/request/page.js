import RequestForm from "../components/RequestForm";
import Footer from "../components/Footer";

export const metadata = {
  title: "Request an in-depth report | DoesAISeeMyStore",
  description: "Get a detailed AI visibility report for your store, with a full breakdown and a clear action plan.",
};

const FREE_REPORTS = process.env.NEXT_PUBLIC_FREE_REPORTS !== "0";

export default async function RequestPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const website = String(sp.website || "").slice(0, 200);
  const reportId = /^[A-Za-z0-9_-]{4,20}$/.test(String(sp.report || "")) ? sp.report : "";

  return (
    <>
      <main className="wrap narrow">
        <header className="top">
          <a href="/" className="logo">
            DoesAI<b>See</b>MyStore
          </a>
          <nav className="topnav" aria-label="Main">
            <a href="/news">News</a>
          </nav>
        </header>

        <div className="page-intro">
          <p className="eyebrow">{FREE_REPORTS ? "Free for a limited time" : "In-depth report"}</p>
          <h1>Get the full picture</h1>
          <p className="sub">
            Your free check is a snapshot. An in-depth report goes further: a detailed breakdown of how AI
            assistants see your store, who they recommend instead, and a clear, step-by-step plan to get
            recommended more often.
          </p>
        </div>

        <div className="card included">
          <h3>What's included</h3>
          <ul>
            <li>The real shopper searches we tested, and exactly where your store appeared</li>
            <li>Who AI assistants recommend instead of you, and why</li>
            <li>Your top fixes in plain English, ranked by impact</li>
            <li>A clear, step-by-step plan to get recommended more often</li>
          </ul>
          <p className="muted small">
            {FREE_REPORTS
              ? "For a limited time, full reports are free while we gather feedback. No payment and no account. All we ask is your honest feedback afterwards, good or bad. It's completely optional."
              : "Enquiring is free and doesn't commit you to anything. We'll email you the price and delivery time before you decide."}
          </p>
        </div>

        <RequestForm website={website} reportId={reportId} />
      </main>
      <Footer />
    </>
  );
}
