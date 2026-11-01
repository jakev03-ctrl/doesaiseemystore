// Information sections under the homepage form: how it works, why it matters, FAQs.

const STEPS = [
  {
    n: "1",
    title: "We read your store",
    text: "We look at your products the way an AI assistant would: descriptions, sizes, materials, prices, delivery and returns.",
  },
  {
    n: "2",
    title: "We search like a shopper",
    text: "We ask an AI assistant with live web search a wide range of realistic questions a customer might ask when looking for what you sell.",
  },
  {
    n: "3",
    title: "You get a score and fixes",
    text: "See how often you were recommended, who was recommended instead, and the top changes that would help AI understand you.",
  },
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. Everyone gets 2 free checks a day. No sign-up, card or email needed.",
  },
  {
    q: "Which AI do you test?",
    a: "We currently test with Claude using live web search, the same way an AI shopping assistant looks things up. Each report says exactly which AI was tested.",
  },
  {
    q: "Why might my score change between checks?",
    a: "AI answers vary from search to search, a bit like search results do. Your report is a snapshot, not a guarantee. Checking again after making changes is the best way to see the trend.",
  },
  {
    q: "Which stores does it work with?",
    a: "It works best with Shopify stores. WooCommerce stores are supported too, and for other platforms like Wix or Squarespace we read the product pages we can find.",
  },
  {
    q: "Do you change anything on my store?",
    a: "No. We only read the information that's already public on your website. Nothing is changed, and you don't need to log in or install anything.",
  },
  {
    q: "What happens to my information?",
    a: "We save your report so its link works, and we don't sell or share anything. Read our privacy page for the details.",
    link: { href: "/privacy", label: "Privacy" },
  },
];

export default function HomeInfo() {
  return (
    <div className="info">
      <section className="info-block" aria-labelledby="how">
        <p className="eyebrow">How it works</p>
        <h2 id="how">A free check in about a minute</h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="card step" key={s.n}>
              <span className="step-n" aria-hidden="true">
                {s.n}
              </span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-block" aria-labelledby="why">
        <p className="eyebrow">Why it matters</p>
        <h2 id="why">Shoppers are asking AI what to buy</h2>
        <div className="card why">
          <p>
            Instead of scrolling through search results, more people now ask AI assistants things like
            "best soy candles under £30" and buy from whatever gets recommended.
          </p>
          <p>
            AI assistants tend to recommend stores whose product information is clear, complete and easy
            to understand. Many small stores are missing simple details, so AI overlooks them, even when
            their products are great.
          </p>
          <p>The good news: most of the fixes are quick, and you don't need to be technical to make them.</p>
        </div>
      </section>

      <section className="info-block" aria-labelledby="faq">
        <p className="eyebrow">Questions</p>
        <h2 id="faq">Frequently asked</h2>
        <div className="faqs">
          {FAQS.map((f) => (
            <details className="card faq" key={f.q}>
              <summary>{f.q}</summary>
              <p className="muted">
                {f.a}
                {f.link && (
                  <>
                    {" "}
                    <a href={f.link.href}>{f.link.label}</a>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="card cta">
        <h3>Ready to find out?</h3>
        <p className="muted">It's free and takes about a minute.</p>
        <a className="button" href="#top">
          Check my store
        </a>
      </section>
    </div>
  );
}
