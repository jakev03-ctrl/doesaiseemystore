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
    t: "We read your website the way AI does",
    d: "Before asking AI anything, we read your store like an AI assistant would: your homepage, about page, delivery and returns pages, contact page, FAQs and your products. We check what AI can actually read there (products, prices, stock, delivery, returns, your story and your reviews), whether AI search robots are allowed in, and whether your sitemap lists your products. Each finding is checked against our AI Shopping Playbook.",
  },
  {
    t: "We see what the web says about you",
    d: "We ask AI about your store by name, the way a curious shopper would, and look at where you turn up online: Google and local listings, review sites, social media, marketplaces, articles and guides. AI leans heavily on what other sites say, so if the web barely mentions you, that's often why AI does too. We also check whether what AI says about you matches your own website.",
  },
  {
    t: "We run the real test: shopper searches",
    d: "We write the questions real shoppers ask for what you sell: everyday searches anyone might type, plus a few about the products you're known for. They're in your shoppers' language, currency and season, and your store is never named. Each one goes to a leading AI assistant with live web search, and we note whether it recommends you, mentions you, finds your site but chooses others, or doesn't find you at all. Re-checks use the same questions, so before and after is a fair test.",
  },
  {
    t: "We show who AI picks instead, and why",
    d: "From the same answers, we show which stores AI recommended instead and what it said about them. It's not a market study: it's there to show what those stores make clear that you don't, so you know what to change.",
  },
  {
    t: "We work out your score and your fixes",
    d: "Your AI Visibility Score comes only from what AI actually did when shoppers asked: a top pick counts most, a passing mention much less, and searches about your speciality count double. Then we write your fixes, best first, each tied to something this check found and to a factor in our AI Shopping Playbook.",
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
