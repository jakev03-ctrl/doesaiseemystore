import RequestForm from "../components/RequestForm";
import Footer from "../components/Footer";

export const metadata = {
  title: "Request an in-depth report | DoesAISeeMyStore",
  description: "Get a detailed AI visibility report for your store, with a full breakdown and a clear action plan.",
};

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
        </header>

        <div className="page-intro">
          <p className="eyebrow">In-depth report</p>
          <h1>Get the full picture</h1>
          <p className="sub">
            Your free check is a snapshot. An in-depth report goes further: a detailed breakdown of how AI
            assistants see your store, who they recommend instead, and a clear, step-by-step plan to get
            recommended more often.
          </p>
        </div>

        <RequestForm website={website} reportId={reportId} />
      </main>
      <Footer />
    </>
  );
}
