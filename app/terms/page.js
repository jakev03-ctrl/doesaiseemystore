import Footer from "../components/Footer";

export const metadata = { title: "Terms | DoesAISeeMyStore" };

export default function Terms() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";
  return (
    <main className="wrap">
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="/news">News</a>
        </nav>
      </header>

      <article className="card prose">
        <h1>Terms of use</h1>
        <p className="muted">Last updated: November 2026</p>

        <p>
          These terms apply when you use doesaiseemystore.com (the "site") and any reports or services we
          provide. By using the site, you agree to them. If you don't agree, please don't use the site.
        </p>

        <h3>1. Who we are</h3>
        <p>
          DoesAISeeMyStore is an online service based in the United Kingdom that checks how AI shopping
          assistants respond to questions about online stores. You can contact us at{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>

        <h3>2. The free check</h3>
        <ul>
          <li>The free check is provided as it is, for general information only.</li>
          <li>We limit how many free checks can be run each day, and may change or stop the free check at any time.</li>
          <li>
            You should only check stores you own, manage or have a genuine interest in. Please don't use the
            site to send automated or excessive requests.
          </li>
        </ul>

        <h3>3. About AI results</h3>
        <p>
          Our reports are based on answers from AI assistants with live web search at the time of the check.
          AI answers change from search to search and over time, and AI assistants can make mistakes. Every
          report is a snapshot, not a guarantee. We don't control how any AI assistant, search engine or
          marketplace ranks or recommends stores, and we can't promise any particular score, ranking, traffic
          or sales.
        </p>

        <h3>4. In-depth reports and paid services</h3>
        <ul>
          <li>
            Enquiring about an in-depth report is free and doesn't commit you to anything. We'll reply by
            email with what's included, the price and the expected delivery time before you decide.
          </li>
          <li>A paid service only begins once you've agreed to the details and paid.</li>
          <li>
            Because reports are prepared specifically for your store, if you ask us to start work straight
            away you may lose your right to cancel once the report has been fully delivered. If you cancel
            before we've started, we'll give you a full refund.
          </li>
          <li>
            If something in your report is wrong or missing, tell us within 14 days of delivery and we'll put
            it right. This doesn't affect your legal rights as a consumer.
          </li>
        </ul>

        <h3>5. Our advice</h3>
        <p>
          Our suggestions are general recommendations to help AI assistants understand your store. You're
          responsible for deciding which changes to make, and for making sure your website, products and
          listings stay accurate and follow the law and the rules of any platform you sell on.
        </p>

        <h3>6. Reports and sharing</h3>
        <p>
          Anyone with a report's link can view it. Reports are kept for up to 90 days. If you'd like one
          removed sooner, contact us.
        </p>

        <h3>7. Our content</h3>
        <p>
          The site, its design and our reports belong to DoesAISeeMyStore. You're welcome to use your own
          report for your business, but please don't copy or resell our reports or the site itself. News
          articles we link to belong to their publishers.
        </p>

        <h3>8. Liability</h3>
        <p>
          Nothing in these terms limits our liability where it would be unlawful to do so, including for death
          or personal injury caused by negligence or for fraud. Otherwise, we aren't liable for any indirect
          losses, or for any loss of profit, revenue, sales or business. For paid services, our total
          liability is limited to the amount you paid us for that service.
        </p>

        <h3>9. Privacy</h3>
        <p>
          How we handle your information is explained in our <a href="/privacy">privacy notice</a>.
        </p>

        <h3>10. Changes and law</h3>
        <p>
          We may update these terms from time to time, and the latest version will always be on this page.
          These terms are governed by the laws of England and Wales.
        </p>
      </article>

      <Footer />
    </main>
  );
}
