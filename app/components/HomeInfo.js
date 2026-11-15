// Information sections under the homepage form and results:
// why now, who it's for, FAQs and a final call to action.
import CountUp from "./CountUp";
import UsualWay from "./UsualWay";

const STATS = [
  {
    big: "1 in 2",
    text: "shoppers in McKinsey's 11-market survey had used AI to help them shop.",
    src: "McKinsey, 2026",
    href: "https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/who-wins-when-ai-does-the-shopping-new-evidence-on-agentic-commerce",
  },
  {
    big: "393%",
    text: "growth in visits to US retail websites from AI assistants in a year, and those visitors were more likely to buy.",
    src: "Adobe, Q1 2026",
    href: "https://business.adobe.com/blog/ai-traffic-surge-retail-sites-not-machine-readable",
  },
  {
    big: "1/3",
    text: "of a typical retail product page's content can't be read by AI, according to Adobe's checks of US retail sites.",
    src: "Adobe, April 2026",
    href: "https://business.adobe.com/blog/ai-traffic-surge-retail-sites-not-machine-readable",
  },
];

const ICONS = {
  shop: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  star: <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />,
  grow: (
    <>
      <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
      <path d="M16 7h6v6" />
    </>
  ),
};

const WHO = [
  { icon: "star", title: "Great products, up against big names", text: "AI tends to recommend the brands everyone already knows. We show you how to give it a reason to mention you too." },
  { icon: "shop", title: "No marketing team needed", text: "Plain English, clear steps and how long each one takes. Most fixes are things you can do yourself in an afternoon." },
  { icon: "grow", title: "Curious how AI shopping works", text: "Learn what AI looks at when it recommends a store, and what it means for your products." },
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. Everyone gets 2 free checks a day. No sign-up, card or email needed.",
  },
  {
    q: "Will this get me more sales?",
    a: "We can't promise that, and no one honestly can. What we do is show you how AI sees your store today, where you're being missed, and the changes most likely to help AI find and recommend you. What happens next is up to your products and your customers.",
  },
  {
    q: "Can I check a competitor's store?",
    a: "Yes. Choose \u201cA competitor's\u201d at the top of the form. Add your own store too and we'll show you both head-to-head on the same searches: which questions each of you wins, and why. It uses one free check.",
  },
  {
    q: "Can I add my own questions?",
    a: "Yes. Add up to 3 questions your buyers actually ask, or tap one of our suggestions. We test them alongside ours and mark them \u201cYour question\u201d in your report.",
  },
  {
    q: "Does it work outside the UK?",
    a: "Yes. Tell us where your customers are, and we'll search the way shoppers there would. Leave it blank and we'll work it out from your store, and search in the local language too.",
  },
  {
    q: "What's in the full report?",
    a: "Every question we asked AI and who it picked, your score over time, your full competitor map, your biggest opportunity, all your quick wins with ready-to-paste text and a step-by-step growth plan. During our beta it's free: just press “Get my full report free” on your results and we'll send it by email.",
  },
  {
    q: "How do you test my store?",
    a: "We read your public product pages, check the technical basics directly, then ask an AI assistant with live web search the questions your customers would ask, and count who gets recommended.",
    link: { href: "/how-we-test", label: "See exactly how we test" },
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
    q: "Who's behind DoesAISeeMyStore?",
    a: "It's run by Jake, here in the UK. It started from a simple question: when shoppers ask AI what to buy, do small stores even get a look in? Got a question? Get in touch any time.",
    link: { href: "/contact", label: "Contact" },
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
      <UsualWay />

      <section className="info-block" aria-labelledby="why">
        <p className="eyebrow">Why now</p>
        <h2 id="why">Why AI visibility matters now</h2>
        <div className="grid3">
          {STATS.map((s) => (
            <div className="card" key={s.big}>
              <CountUp text={s.big} />
              <p className="muted">{s.text}</p>
              <p className="src">
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.src}
                </a>
              </p>
            </div>
          ))}
        </div>
        <p className="muted more-link">
          <a href="/news">Read the latest news on AI shopping →</a>
        </p>
      </section>

      <section className="info-block" aria-labelledby="who">
        <p className="eyebrow">Who it's for</p>
        <h2 id="who">Made for stores like yours</h2>
        <div className="grid3">
          {WHO.map((w) => (
            <div className="card" key={w.title}>
              <div className="icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {ICONS[w.icon]}
                </svg>
              </div>
              <h3>{w.title}</h3>
              <p className="muted">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }).replace(/</g, "\\u003c"),
        }}
      />
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
        <h3>See how AI sees your store</h3>
        <p className="muted">It's free, and you'll know exactly what to do next.</p>
        <a className="button" href="#check">
          Check my store
        </a>
      </section>
    </div>
  );
}
