// Information sections under the homepage form and results:
// why now, who it's for, FAQs and a final call to action.
import CountUp from "./CountUp";

const STATS = [
  {
    big: "1 in 2",
    text: "shoppers used AI to help them shop in the past three months.",
    src: "McKinsey, October 2026",
  },
  {
    big: "393%",
    text: "growth in visits to online shops from AI assistants in a year, and those visitors were more likely to buy.",
    src: "Adobe data via TechCrunch, April 2026",
  },
  {
    big: "1 in 3",
    text: "retail product pages aren't easy for AI to read, so many stores are being skipped.",
    src: "Adobe data via TechCrunch, April 2026",
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
  { icon: "shop", title: "Online shops", text: "Small and medium stores on Shopify, Etsy, WooCommerce and more, anywhere in the world." },
  { icon: "star", title: "Independent brands", text: "Great products, up against the big names AI tends to recommend by default." },
  { icon: "grow", title: "Ready to grow", text: "Businesses that want to get ahead of the shift to AI shopping before their competitors do." },
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. Everyone gets 2 free checks a day. No sign-up, card or email needed.",
  },
  {
    q: "Does it work outside the UK?",
    a: "Yes. Tell us where your customers are, and we'll search the way shoppers there would. Leave it blank and we'll work it out from your store, and search in the local language too.",
  },
  {
    q: "What's in the full report?",
    a: "Every search we tested and your position in each, your full competitive map, every category, all your quick wins and a step-by-step growth plan. For a limited time it's free: just press “Get my full report free” on your results and we'll send it by email.",
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
    a: "It's run by Jake, here in the UK. It started from a simple question: when shoppers ask AI what to buy, do small shops even get a look in? Got a question? Get in touch any time.",
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
      <section className="info-block" aria-labelledby="why">
        <p className="eyebrow">Why now</p>
        <h2 id="why">Why AI visibility matters now</h2>
        <div className="grid3">
          {STATS.map((s) => (
            <div className="card" key={s.big}>
              <CountUp text={s.big} />
              <p className="muted">{s.text}</p>
              <p className="src">{s.src}</p>
            </div>
          ))}
        </div>
        <p className="muted more-link">
          <a href="/news">Read the latest news on AI shopping →</a>
        </p>
      </section>

      <section className="info-block" aria-labelledby="who">
        <p className="eyebrow">Who it's for</p>
        <h2 id="who">Built for growing stores</h2>
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
        <p className="muted">It's free and takes under 60 seconds.</p>
        <a className="button" href="#top">
          Check my store
        </a>
      </section>
    </div>
  );
}
