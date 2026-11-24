import Legal from "../components/Legal";

export const metadata = {
  title: "Terms | DoesAISeeMyStore",
  description: "The terms for using DoesAISeeMyStore and its reports.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms", description: "The terms for using DoesAISeeMyStore.", url: "/terms", siteName: "DoesAISeeMyStore", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" }] },
};

export default function Terms() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@doesaiseemystore.com";
  const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Jake";
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "";

  const sections = [
    {
      id: "who",
      title: "Who we are",
      body: (
        <>
          <p>
            DoesAISeeMyStore is an online service run by {owner}, based in Lancashire, United Kingdom. It checks how AI
            shopping assistants respond to questions about online stores. You can reach us at{" "}
            <a href={`mailto:${email}`}>{email}</a>
            {address ? `, or write to ${address}` : ""}.
          </p>
          <p>
            These terms apply when you use doesaiseemystore.com (the "site") and any reports or services we provide. By
            using the site, you agree to them. If you don't agree, please don't use the site.
          </p>
        </>
      ),
    },
    {
      id: "free",
      title: "The free check",
      body: (
        <ul>
          <li>The free check is provided as it is, for general information only.</li>
          <li>Each person can run 2 free checks a day. We may change this limit, or change or stop the free check, at any time.</li>
          <li>
            You can check your own store or a competitor's. We only read information that's publicly available on a
            store's website, and we respect each site's robots.txt.
          </li>
          <li>Please don't use the site to send automated or excessive requests.</li>
        </ul>
      ),
    },
    {
      id: "ai",
      title: "About AI results",
      body: (
        <>
          <p>
            Our reports are based on answers from AI assistants with live web search at the time of the check. AI
            answers change from search to search and over time, and AI assistants can make mistakes.
          </p>
          <p className="legal-note">
            Every report is a snapshot, not a guarantee. We don't control how any AI assistant, search engine or
            marketplace ranks or recommends stores, and we can't promise any particular score, ranking, traffic or sales.
          </p>
        </>
      ),
    },
    {
      id: "reports",
      title: "Full reports and paid services",
      body: (
        <ul>
          <li>
            Full reports are currently free, with nothing to pay and no obligation. We ask for an honest review
            afterwards, but it's optional, your report doesn't depend on it, and you're free to say whatever you
            genuinely think. We may end the free offer at any time, but we'll still send any free report we've already
            agreed to send.
          </li>
          <li>
            When we start charging, asking about a report will still be free and won't commit you to anything. We'll
            tell you what's included, the price and when you'll get it before you decide.
          </li>
          <li>A paid service only begins once you've agreed to the details and paid.</li>
          <li>
            Because reports are prepared specifically for your store, if you ask us to start straight away you may lose
            your right to cancel once the report has been fully delivered. If you cancel before we've started, you'll get
            a full refund.
          </li>
          <li>
            If something in your report is wrong or missing, tell us within 14 days of delivery and we'll put it right.
            This doesn't affect your legal rights as a consumer.
          </li>
        </ul>
      ),
    },
    {
      id: "advice",
      title: "Our advice",
      body: (
        <p>
          Our suggestions are general recommendations to help AI assistants understand your store. You decide which
          changes to make, and you're responsible for keeping your website, products and listings accurate and in line
          with the law and the rules of any platform you sell on.
        </p>
      ),
    },
    {
      id: "sharing",
      title: "Reports and sharing",
      body: (
        <p>
          Anyone with a report's link can view it, and a full report link shows the whole report. Reports are kept for
          up to 90 days, then deleted automatically. If you'd like one removed sooner, just ask.
        </p>
      ),
    },
    {
      id: "reviews",
      title: "Reviews",
      body: (
        <p>
          Any reviews we show are from real customers, shown with their permission. Reviews from people who received a
          free full report are labelled as such. We don't edit reviews to change their meaning, and we don't hide
          negative ones.
        </p>
      ),
    },
    {
      id: "content",
      title: "Our content",
      body: (
        <p>
          The site, its design and our reports belong to DoesAISeeMyStore. You're welcome to use your own report for your
          business, but please don't copy or resell our reports or the site itself. News articles we link to belong to
          their publishers.
        </p>
      ),
    },
    {
      id: "liability",
      title: "Liability",
      body: (
        <>
          <p>
            Nothing in these terms limits our liability where it would be unlawful to do so, including for death or
            personal injury caused by negligence, or for fraud.
          </p>
          <p>
            Otherwise, we aren't liable for any indirect losses, or for any loss of profit, revenue, sales or business.
            For paid services, our total liability is limited to the amount you paid us for that service. Free checks and
            free reports are provided as they are, without any promise of results.
          </p>
        </>
      ),
    },
    {
      id: "changes",
      title: "Privacy, changes and law",
      body: (
        <>
          <p>
            How we handle your information is explained in our <a href="/privacy">privacy notice</a>.
          </p>
          <p>
            We may update these terms from time to time, and the latest version will always be on this page. These terms
            are governed by the laws of England and Wales.
          </p>
        </>
      ),
    },
  ];

  return (
    <Legal
      kind="Terms"
      title="Terms of use"
      intro="The ground rules for using DoesAISeeMyStore and its reports, written as plainly as we can."
      updated="November 2026"
      email={email}
      summary={[
        "The free check is free, with no account or card needed.",
        "Reports show what AI said at the time. AI answers change, so we can't promise rankings or sales.",
        "You decide which fixes to make to your own store.",
        "Anyone with a report link can see it, so share links carefully.",
        "We only show real reviews, with permission, and never hide negative ones.",
      ]}
      sections={sections}
    />
  );
}
