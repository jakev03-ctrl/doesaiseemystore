export const metadata = { title: "Privacy | DoesAISeeMyStore" };

export default function Privacy() {
  return (
    <main>
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
      </header>

      <article className="card prose">
        <h1>Privacy</h1>
        <p className="muted">Last updated: October 2026</p>

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
        <p>We don't ask for your name or email, and we don't sell or share your information.</p>

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
          If you'd like a report removed or have any questions, contact us at{" "}
          <b>[your contact email]</b>.
        </p>
      </article>

      <footer>
        © {new Date().getFullYear()} DoesAISeeMyStore
      </footer>
    </main>
  );
}
