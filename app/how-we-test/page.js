import Footer from "../components/Footer";

export const metadata = {
  title: "How we test | DoesAISeeMyStore",
  description:
    "How DoesAISeeMyStore checks whether AI shopping assistants recommend your store: what we read, the searches we run, how the score works and what we never do.",
};

const STEPS = [
  {
    t: "We read your store like an AI assistant would",
    d: "We look at your public product pages: names, descriptions, sizes, materials, prices, delivery and returns. We only read what anyone can already see.",
  },
  {
    t: "We check the technical basics directly",
    d: "Whether AI readers (like ChatGPT's, Claude's and Google's) are blocked by your robots.txt, whether you have a sitemap listing your products, and whether your product pages carry structured data AI can read. These are checked in code, not guessed.",
  },
  {
    t: "We search like your customers",
    d: "We write realistic questions a shopper in your market would ask about what you sell, in their language and currency, then ask an AI assistant with live web search, the same way a real shopper would.",
  },
  {
    t: "We record who gets recommended",
    d: "For every search we note whether your store came up, where it came in the list, and which other stores were recommended instead.",
  },
  {
    t: "We work out your score and stats",
    d: "Your score combines how often you were recommended (60%) with how easy your product information is for AI to understand (40%). Every stat in your report is counted from these real results, not estimated.",
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
          <p className="sub">No guesswork: here's exactly what happens in the 60 seconds after you press "Check my store".</p>
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
          <h3>Why results can change</h3>
          <p>
            AI assistants don't give the same answer every time, a bit like search results. That's why the most useful thing is to check again
            after you've made changes and watch the trend.
          </p>
        </div>

        <div className="card cta">
          <h3>Ready to see yours?</h3>
          <p className="muted">Free, no sign-up, and it takes under 60 seconds.</p>
          <a className="button" href="/#check">
            Check my store
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
