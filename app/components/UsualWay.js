"use client";

import { useEffect, useRef, useState } from "react";

// "The usual way vs our way". Every line on our side is something the site really does.
// Each point has a short bold title and one line of detail; both sides line up point for point.
const USUAL = [
  ["A rebranded SEO checklist", "Generic website tips labelled “AI visibility”, without actually asking AI anything."],
  ["A score you can't check", "A number out of 100 from a black box, with no searches or answers to back it up."],
  ["One-size-fits-all questions", "The same handful of prompts whether you sell candles in Kent or hoovers in Leeds."],
  ["No idea who's beating you", "Nothing on which stores AI recommends instead of you, or why."],
  ["Vague tips and big promises", "“Improve your content” and “boost your sales”, with no steps for the platform you actually use."],
  ["Hoops before any results", "Sign-up, card details and a sales call before you see a thing."],
];
const OURS = [
  ["Real shopper questions, asked live", "We ask leading AI assistants, with live web search, the everyday questions your customers type, like “best cordless hoover under £200”."],
  ["Every answer shown", "Each search is listed: the exact question, who AI recommended, and whether you were named."],
  ["Written for your store", "Questions built from your products, prices, location and language. Add your own too."],
  ["Who wins instead, and why", "See the stores AI picked over you, and what they're doing that you're not."],
  ["Your website and reputation checked", "We read your product pages, prices and contact details, and look at what other sites say about you."],
  ["Steps for your platform", "Fixes for Shopify, WooCommerce, Squarespace, Wix and more. Each says what to do, why it matters and how you'll know it's working."],
];
const PROMISES = ["Free to check", "No account or card needed", "No sales call", "No promises we can't keep"];

function Item({ icon, title, text }) {
  return (
    <li>
      <span className="ic" aria-hidden="true">
        {icon}
      </span>
      <span>
        <strong className="vs-t">{title}</strong>
        <span className="vs-d">{text}</span>
      </span>
    </li>
  );
}

export default function UsualWay() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="info-block" aria-labelledby="vsTitle">
      <p className="eyebrow">Why our results are different</p>
      <h2 id="vsTitle">Proof you can check, not a score you can't</h2>
      <p className="vs-sub">Most “AI visibility” tools hand you a number. We show you exactly what AI said, and what to do about it.</p>
      <div className={`vs${seen ? " seen" : ""}`} ref={ref}>
        <div className="card usual">
          <h3>The usual way</h3>
          <ul>
            {USUAL.map(([t, d]) => (
              <Item key={t} icon="✕" title={t} text={d} />
            ))}
          </ul>
        </div>
        <div className="card ours">
          <h3>Our way</h3>
          <ul>
            {OURS.map(([t, d]) => (
              <Item key={t} icon="✓" title={t} text={d} />
            ))}
          </ul>
        </div>
      </div>
      <ul className="vs-strip">
        {PROMISES.map((t) => (
          <li key={t}>
            <span aria-hidden="true">✓</span> {t}
          </li>
        ))}
      </ul>
      <p className="vs-foot">
        Every search is listed in your report: what shoppers asked, and who got picked. <a href="/how-we-test">See how we test →</a>
      </p>
    </section>
  );
}
