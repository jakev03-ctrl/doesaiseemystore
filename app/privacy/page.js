import Legal from "../components/Legal";

export const metadata = {
  title: "Privacy | DoesAISeeMyStore",
  description: "What DoesAISeeMyStore collects, why, how long we keep it and your rights.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy", description: "What we collect, why, how long we keep it and your rights.", url: "/privacy", siteName: "DoesAISeeMyStore", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" }] },
};

export default function Privacy() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@doesaiseemystore.com";
  const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Jake";
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "";

  const sections = [
    {
      id: "who",
      title: "Who we are",
      body: (
        <p>
          DoesAISeeMyStore is a small UK business run by {owner}, based in Lancashire{address ? ` (${address})` : ""}.
          We're responsible for the information described on this page. If you have a question about it, email{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      ),
    },
    {
      id: "collect",
      title: "What we collect, and why",
      body: (
        <>
          <p>We keep this to the minimum we need to run the site.</p>
          <dl className="legal-list">
            <dt>The store details you enter</dt>
            <dd>The website, what it sells, its location and anything extra you add. We use these to run your check and build your report.</dd>
            <dt>Your report</dt>
            <dd>Saved so its link keeps working, then deleted (see the table below).</dd>
            <dt>A device cookie and your IP address</dt>
            <dd>
              Only to limit how many free checks can be run each day. We never store your IP address as it is, only a
              one-way scrambled version combined with a secret key. The cookie is needed for the site to work, so we
              don't ask for consent for it.
            </dd>
            <dt>Anonymous visit statistics</dt>
            <dd>Things like page views, collected by Vercel Analytics without cookies and without identifying you.</dd>
            <dt>Your light or dark mode choice and recent checks</dt>
            <dd>Saved only in your own browser. We never receive them.</dd>
          </dl>
        </>
      ),
    },
    {
      id: "contact",
      title: "If you contact us or ask for a report",
      body: (
        <>
          <p>
            We keep the details you give us, such as your name or business name, website, email address and message,
            so we can reply and send your report.
          </p>
          <p>
            If you ask us to email your report, we use your email address to send that one email. We only keep it if
            you also tick the box to get tips, and you can unsubscribe at any time by replying to any email.
          </p>
          <p>
            We only show your feedback publicly if you tick the box allowing it. If you received a free full report,
            your review will always say so.
          </p>
        </>
      ),
    },
    {
      id: "keep",
      title: "How long we keep it",
      body: (
        <div className="legal-table" role="table" aria-label="How long we keep information">
          {[
            ["Reports", "Up to 90 days, then deleted automatically"],
            ["Daily check counters", "2 days"],
            ["Device cookie", "Up to a year"],
            ["Messages and report requests", "12 months"],
            ["Feedback", "Up to 2 years"],
            ["Email for tips (only if you opt in)", "Until you unsubscribe"],
          ].map(([a, b]) => (
            <div role="row" key={a}>
              <span role="cell">{a}</span>
              <span role="cell">{b}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "providers",
      title: "Who helps us run the service",
      body: (
        <>
          <div className="legal-table" role="table" aria-label="Service providers">
            {[
              ["Vercel", "Hosts the website and provides anonymous visit statistics"],
              ["Upstash", "Our database: reports, enquiries and statistics"],
              ["AI service providers (US)", "Run the searches for each check. They receive the store details you enter, never your email address"],
              ["Resend", "Sends our emails, including alerts to us about new enquiries"],
            ].map(([a, b]) => (
              <div role="row" key={a}>
                <span role="cell">{a}</span>
                <span role="cell">{b}</span>
              </div>
            ))}
          </div>
          <p>
            Some of these providers are based outside the UK, including in the United States. They handle information on
            our behalf under data protection terms with the safeguards UK law requires for international transfers, such
            as the UK International Data Transfer Addendum or the UK–US Data Bridge.
          </p>
          <p>
            <b>We don't sell your information, and we don't share it with anyone else.</b>
          </p>
        </>
      ),
    },
    {
      id: "basis",
      title: "Our lawful basis",
      body: (
        <dl className="legal-list">
          <dt>Running your check and saving your report</dt>
          <dd>Legitimate interests, to provide the service you asked for.</dd>
          <dt>Daily limits and preventing abuse</dt>
          <dd>Legitimate interests, to keep the free check fair and the service secure.</dd>
          <dt>Replying to you and sending reports you've asked for</dt>
          <dd>Legitimate interests, or taking steps at your request.</dd>
          <dt>Tips emails</dt>
          <dd>Your consent, which you can withdraw at any time.</dd>
          <dt>Anonymous visit statistics</dt>
          <dd>Legitimate interests, to understand how the site is used.</dd>
        </dl>
      ),
    },
    {
      id: "stores",
      title: "Store information and report links",
      body: (
        <>
          <p>
            The information we read about a store is already public on that store's own website. We respect each
            store's robots.txt: if it asks automated tools like ours not to read the site, we don't.
          </p>
          <p>
            Anyone with a report's link can view it. A full report link shows the whole report, so only share links with
            people you're happy to show.
          </p>
        </>
      ),
    },
    {
      id: "rights",
      title: "Your rights",
      body: (
        <>
          <p>
            You can ask to see the information we hold about you, have it corrected or deleted, or object to how we use
            it. Just email <a href={`mailto:${email}`}>{email}</a> or use our <a href="/contact">contact page</a>, and
            we'll reply within one month at the latest.
          </p>
          <p>
            If you're unhappy with how we've handled your information, please tell us first so we can put it right. You
            can also complain to the Information Commissioner's Office at <a href="https://ico.org.uk">ico.org.uk</a>.
          </p>
        </>
      ),
    },
  ];

  return (
    <Legal
      kind="Privacy"
      title="Your privacy"
      intro="What we collect when you use DoesAISeeMyStore, why we need it, how long we keep it, and what you can ask us to do with it."
      updated="November 2026"
      email={email}
      summary={[
        "No account needed, and we never ask for card details to run a check.",
        "We only use what you enter to run your check and build your report.",
        "Reports are deleted after 90 days. Most other information is deleted automatically too.",
        "No advertising or tracking cookies. We never sell your information.",
        "You can ask us to show you, correct or delete your information at any time.",
      ]}
      sections={sections}
    />
  );
}
