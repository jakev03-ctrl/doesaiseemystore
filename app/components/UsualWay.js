"use client";

import { useEffect, useRef, useState } from "react";

// "The usual way vs our way". Every line on our side is something the site really does.
const USUAL = [
  "A generic SEO checklist dressed up as “AI visibility”",
  "A score from a black box, with no way to check it",
  "The same handful of questions for every kind of shop",
  "Vague tips like “improve your content”",
  "Sign-up, card details and a sales call before you see anything",
];
const OURS = [
  "We ask a real AI assistant, with live web search, what your shoppers would ask",
  "Every search is listed: what we asked, and who got recommended",
  "Questions written for your products, your market and your language, plus your own",
  "Fixes with copy-and-paste text for your store",
  "Free, under 60 seconds, no account needed",
];

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
      <div className={`vs${seen ? " seen" : ""}`} ref={ref}>
        <div className="card usual">
          <h3>The usual way</h3>
          <ul>
            {USUAL.map((t) => (
              <li key={t}>
                <span className="ic" aria-hidden="true">
                  ✕
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card ours">
          <h3>Our way</h3>
          <ul>
            {OURS.map((t) => (
              <li key={t}>
                <span className="ic" aria-hidden="true">
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="vs-foot">
        Run any of our searches yourself in ChatGPT and see what you get. <a href="/how-we-test">See exactly how we test →</a>
      </p>
    </section>
  );
}
