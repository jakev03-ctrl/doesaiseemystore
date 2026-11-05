import FeedbackForm from "../components/FeedbackForm";
import Footer from "../components/Footer";

export const metadata = {
  title: "How did we do? | DoesAISeeMyStore",
  description: "Tell us what you thought of your DoesAISeeMyStore report.",
  robots: { index: false },
};

export default function Feedback() {
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
          <h1>How did we do?</h1>
          <p className="sub">
            Thanks for trying your full report. Honest feedback, good or bad, helps us make it better for every shop.
          </p>
        </div>

        <FeedbackForm />
      </main>
      <Footer />
    </>
  );
}
