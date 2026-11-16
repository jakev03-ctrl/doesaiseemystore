import Footer from "../components/Footer";

export const metadata = {
  alternates: { canonical: "/how-we-test" },
  openGraph: { title: "How we test", description: "Exactly how DoesAISeeMyStore checks whether AI shopping assistants recommend your store.", url: "/how-we-test", siteName: "DoesAISeeMyStore", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" }] },
  title: "How we test | DoesAISeeMyStore",
  description:
    "How DoesAISeeMyStore checks whether AI shopping assistants recommend your store: what we read, the searches we run, how the score works and what we never do.",
};

const STEPS = [
  {
    t: "We get to know your store",
    d: "Before asking AI anything, we read your store like a curious customer: your homepage, about page, delivery and returns pages, FAQs and your products. We build a picture of what you sell, who buys from you, what you stand for and how big you are, and check it against what you told us. We work out whether you're a local shop or an online-first store, then research your real direct competitors: shops of your size and kind (nearby, if you're local), not just the national giants.",
  },
  {
    t: "We write the searches real shoppers make",
    d: "Most are the everyday searches anyone types for what you sell: the fair test. For a local shop, that means the searches people near you make, like “best clothes shops in Lytham” or “near me”, asked as if from your town. A few are built around you: your speciality, your typical customer, a need you solve, and small independent sellers like you. They're written in your shoppers' language, currency and season, and re-checks use the same searches so before and after is fair.",
  },
  {
    t: "We ask AI exactly like a shopper would",
    d: "Each search goes to a leading AI assistant with live web search, worded exactly as a shopper would type it, with nothing to steer the answer. We record what the AI searched for and every page it looked at.",
  },
  {
    t: "We read every answer carefully",
    d: "For each answer we note every store recommended, in what order, why, at what price, and how you came up: top pick, recommended, a passing mention, found but not chosen, or not found at all.",
  },
  {
    t: "We ask follow-up questions",
    d: "Like a shopper asking more, we ask for smaller shops and then ask about you by name. This shows how well AI really knows you, and what it says about you. Follow-ups explain your score; they don't change it.",
  },
  {
    t: "We study why the winners win",
    d: "We read the website of the store AI picks most and compare it with yours, using the reasons AI itself gave. Every fix we suggest is tied to our AI Shopping Playbook, built from what AI companies, researchers and industry data say about how AI chooses stores.",
  },
  {
    t: "We work out your score",
    d: "Your AI Visibility Score comes only from what AI actually did: a top pick counts most, a passing mention much less, and your home-turf search counts double. Your AI-ready checklist is checked directly on your site.",
  },
];

export default function HowWeTest() {
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
          <p className="eyebrow">How we test</p>
          <h1>How your check works</h1>
          <p className="sub">No guesswork: here's exactly what happens in the couple of minutes after you press "Check my store".</p>
        </div>

        <ol className="how-steps">
          {STEPS.map((s, i) => (
            <li className="card" key={i}>
              <span className="step-n">{i + 1}</span>
              <div>
                <h3>{s.t}</h3>
                <p className="muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="card prose">
          <h3>What we never do</h3>
          <ul>
            <li>We never change anything on your store, and you never need to log in or install anything.</li>
            <li>We respect your robots.txt: if your store asks automated tools not to read it, we don't.</li>
            <li>We don't sell or share your information.</li>
            <li>We don't promise sales or rankings. AI answers change, so every report is a snapshot.</li>
          </ul>
          <h3>What your score means</h3>
          <ul>
            <li><b>AI's favourite (75+)</b>: AI's go-to store in your market.</li>
            <li><b>Contender (55 to 74)</b>: AI recommends you regularly.</li>
            <li><b>On the radar (35 to 54)</b>: AI knows you, but rarely picks you.</li>
            <li><b>Whisper (15 to 34)</b>: AI mentions you now and then.</li>
            <li><b>Ghost (under 15)</b>: AI doesn't know you exist yet.</li>
          </ul>
          <h3>Why results can change</h3>
          <p>
            AI assistants don't give the same answer every time, and different assistants can answer differently, a bit like search results.
            A check is a sample of real shopper searches, so a result could come back a little higher or lower on another day.
            That's why the most useful thing is to check again after you've made changes and watch the trend.
          </p>
        </div>

        <div className="card cta">
          <h3>Ready to see yours?</h3>
          <p className="muted">Free, no sign-up, and it takes about 2 minutes.</p>
          <a className="button" href="/#check">
            Check my store
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
