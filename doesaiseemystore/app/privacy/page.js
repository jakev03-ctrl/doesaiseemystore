import Footer from "../components/Footer";

export const metadata = { title: "Privacy | DoesAISeeMyStore" };

export default function Privacy() {
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
        <h1>Privacy</h1>
        <p className="muted">Last updated: November 2026</p>

        <h3>What we collect</h3>
        <ul>
          <li>
            <b>The store address and category you enter.</b> We use these to run your check and to
            create your report.
          </li>
          <li>
            <b>Your report.</b> We save each report for up to 90 days so its link works and so we can
            show the same result if the store is checked again the same day.
          </li>
          <li>
            <b>A device cookie and your IP address</b> (stored in a scrambled form), only to limit how
            many free checks can be run each day.
          </li>
          <li>
            <b>Anonymous visit statistics</b> (such as page views), which do not identify you.
          </li>
        </ul>

        <h3>What we don't collect</h3>
        <p>Running a check doesn't need your name or email, and we don't sell or share your information.</p>

        <h3>Contact messages</h3>
        <p>
          If you send us a message or request an in-depth report, we keep the details you give us (such as
          your name or business name, website, email address and message) so we can reply. We delete messages when they're no longer needed.
        </p>

        <h3>Who helps us run the service</h3>
        <p>
          To run checks, the store details you enter are sent to AI providers (Anthropic and, where
          enabled, OpenAI). The site is hosted by Vercel and our database is provided by Upstash.
          The store information we read is publicly available on the store's own website.
        </p>

        <h3>Report links</h3>
        <p>
          Anyone with a report's link can view it. Only share it with people you're happy to show.
        </p>

        <h3>Questions or removal</h3>
        <p>
          If you'd like a report removed, want to know what we hold about you, or have any questions,
          email us at <a href={`mailto:${email}`}>{email}</a> or use our{" "}
          <a href="/contact">contact page</a>.
        </p>
      </article>

      <Footer />
    </main>
  );
}
