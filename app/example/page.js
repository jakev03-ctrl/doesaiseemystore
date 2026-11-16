import Footer from "../components/Footer";
import Report from "../components/Report";
import { publicView } from "../../lib/report";
import { EXAMPLE_REPORT } from "../../lib/exampleReport";

const OG = { url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" };

export const metadata = {
  alternates: { canonical: "/example" },
  title: "Example AI visibility report | DoesAISeeMyStore",
  description: "See a full example report: what AI shoppers saw, who got recommended instead, what AI gets wrong, and the exact steps to fix it.",
  openGraph: { title: "Example AI visibility report", description: "See exactly what you get: real AI answers, who AI recommends instead, and what to fix.", url: "/example", siteName: "DoesAISeeMyStore", type: "website", images: [OG] },
};

// A complete example report for a made-up store, built with the same component as real reports.
export default function ExamplePage() {
  const report = publicView(EXAMPLE_REPORT, { full: true });
  return (
    <main id="main" className="wrap">
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="/#check">Check my store</a>
        </nav>
      </header>

      <div className="ex-ribbon">
        <b>Example report</b> Shoe Heaven is a made-up store. Every section is unlocked, so you can see exactly what you'll get.
      </div>

      <Report report={report} example />

      <div className="card cta">
        <p className="eyebrow">That was Shoe Heaven</p>
        <h3>Now see what AI says about your store.</h3>
        <p className="muted">The same report for your store, with your real competitors, your real products and real AI answers.</p>
        <a className="button" href="/#check">
          Check my store free
        </a>
        <p className="muted small">Free check, forever · No account or card</p>
      </div>
      <Footer />
    </main>
  );
}
