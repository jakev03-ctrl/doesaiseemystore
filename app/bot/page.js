import Footer from "../components/Footer";

const OG = { url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" };

export const metadata = {
  alternates: { canonical: "/bot" },
  title: "About our bot | DoesAISeeMyStore",
  description: "Seen DoesAISeeMyStore in your website logs? Here's what our checker reads, how it behaves, and how to block it if you'd like.",
  openGraph: { title: "About our bot", description: "What the DoesAISeeMyStore checker reads, and how to block it.", url: "/bot", siteName: "DoesAISeeMyStore", type: "website", images: [OG] },
};

export default function BotPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";
  return (
    <>
      <main id="main" className="wrap narrow">
        <header className="top">
          <a href="/" className="logo">
            DoesAI<b>See</b>MyStore
          </a>
        </header>

        <div className="page-intro">
          <p className="eyebrow">For website owners</p>
          <h1>About our bot</h1>
          <p className="sub">Seen "DoesAISeeMyStore" in your website logs? Here's exactly what it is and what it does.</p>
        </div>

        <div className="card prose">
          <h3>What it is</h3>
          <p>
            When someone checks a store on DoesAISeeMyStore, our checker reads a few of that store's public pages to see how easy its products are for AI
            assistants to understand. It's the same information anyone can see in a web browser.
          </p>
          <h3>What it reads</h3>
          <ul>
            <li>Your robots.txt and sitemap</li>
            <li>Your homepage and a small sample of public product pages</li>
            <li>Public product listings your store already publishes (for example, a Shopify or WooCommerce product feed)</li>
          </ul>
          <h3>How it behaves</h3>
          <ul>
            <li>It respects robots.txt. If your robots.txt asks it not to read your site, it won't.</li>
            <li>It reads about a dozen pages at most, once per check, so it won't slow your site down.</li>
            <li>It never logs in, fills in forms, adds to basket or buys anything.</li>
            <li>It identifies itself as DoesAISeeMyStore in its user agent.</li>
          </ul>
          <h3>How to block it</h3>
          <p>Add these two lines to your robots.txt:</p>
          <pre className="code">{`User-agent: DoesAISeeMyStore
Disallow: /`}</pre>
          <h3>Questions?</h3>
          <p>
            Email us at <a href={`mailto:${email}`}>{email}</a> and we'll reply within a working day.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
