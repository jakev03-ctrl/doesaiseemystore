import Footer from "../components/Footer";

export const metadata = {
  title: "Privacy | DoesAISeeMyStore",
  description: "What DoesAISeeMyStore collects, why, how long we keep it and your rights.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy", description: "What we collect, why, how long we keep it and your rights.", url: "/privacy", siteName: "DoesAISeeMyStore", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" }] },
};

export default function Privacy() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";
  const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Jake";
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "";
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

        <h3>Who we are</h3>
        <p>
          DoesAISeeMyStore is run by {owner}, based in Lancashire, United Kingdom. We're responsible for the
          information described here. Contact: <a href={`mailto:${email}`}>{email}</a>.
          {address ? ` Address: ${address}.` : ""}
        </p>

        <h3>What we collect, and why</h3>
        <ul>
          <li>
            <b>The store details you enter</b> (website, what it sells, location and any extra information).
            We use these to run your check and create your report.
          </li>
          <li>
            <b>Your report.</b> Saved for up to 90 days so its link works, then deleted automatically.
          </li>
          <li>
            <b>A device cookie and your IP address</b>, only to limit how many free checks can be run each day. The
            IP address is never stored as it is: we keep a one-way scrambled version (a hash combined with a secret
            key), and the daily counters are deleted after 2 days. The cookie lasts up to a year. It's needed for
            the site to work, so we don't ask for consent for it.
          </li>
          <li>
            <b>Anonymous visit statistics</b> (such as page views), collected by Vercel Analytics without cookies
            and without identifying you.
          </li>
          <li>
            <b>Your light or dark mode choice and your recent checks</b> are saved only in your own browser. We
            never receive them.
          </li>
        </ul>

        <h3>If you contact us, request a report or leave feedback</h3>
        <p>
          We keep the details you give us (such as your name or business name, website, email address and
          message) so we can reply and send your report. These are deleted automatically after 12 months.
          Feedback is kept for up to 2 years. We only show your feedback publicly if you tick the box allowing it,
          and it will always be labelled "Received a free full report" where that applies.
        </p>

        <h3>If you ask us to email your report</h3>
        <p>
          We use your email address to send that one email. We only keep it if you also tick the optional box
          to get tips. In that case we keep it until you unsubscribe, which you can do at any time by replying to
          any email or contacting us.
        </p>

        <h3>Who helps us run the service</h3>
        <ul>
          <li><b>Vercel</b> hosts the website.</li>
          <li><b>Upstash</b> provides our database (reports, enquiries and statistics).</li>
          <li>
            <b>AI service providers</b> based in the United States run the searches for each check. The store
            details you enter are sent to them to do this. We don't send them your email address.
          </li>
          <li><b>Resend</b> sends our emails, including alerts to us about new enquiries.</li>
        </ul>
        <p>
          Some of these providers are based outside the UK, including in the United States. They process
          information on our behalf under data protection terms that include the safeguards UK law requires for
          international transfers, such as the UK International Data Transfer Addendum or the UK–US Data Bridge.
          We don't sell or share your information with anyone else.
        </p>

        <h3>Our lawful basis</h3>
        <ul>
          <li><b>Running your check and saving your report:</b> to provide the service you asked for (legitimate interests).</li>
          <li><b>Daily limits and preventing abuse:</b> legitimate interests, to keep the free check fair and the service secure.</li>
          <li><b>Replying to messages and sending reports you've asked for:</b> legitimate interests, or taking steps at your request.</li>
          <li><b>Tips emails:</b> your consent, which you can withdraw at any time.</li>
          <li><b>Anonymous visit statistics:</b> legitimate interests, to understand how the site is used.</li>
        </ul>
        <p>
        </p>

        <h3>Store information</h3>
        <p>
          The information we read about a store is publicly available on the store's own website. We respect a
          store's robots.txt: if it asks automated tools like ours not to read the site, we don't.
        </p>

        <h3>Report links</h3>
        <p>Anyone with a report's link can view it. Only share it with people you're happy to show.</p>

        <h3>Your rights</h3>
        <p>
          You can ask to see the information we hold about you, have it corrected or deleted, or object to how
          we use it. Just email <a href={`mailto:${email}`}>{email}</a> or use our{" "}
          <a href="/contact">contact page</a>. If you're unhappy with how we've handled your information, you
          can complain to the Information Commissioner's Office (ico.org.uk).
        </p>
      </article>

      <Footer />
    </main>
  );
}
