"use client";

import { useEffect, useRef } from "react";
import Constellation from "./Constellation";

// "Billions now ask AI what to buy": big, sourced numbers that count up when you scroll to them.
// Check these figures every few months and update them with the latest announcements.
const STATS = [
  { to: 1.2, dec: 1, suf: "B+", text: "people use ChatGPT every week", src: "OpenAI DevDay, Sep 2026", href: "https://openai.com/index/devday-2026-recap/" },
  { to: 2.5, dec: 1, suf: "B+", text: "monthly users of Google's AI Overviews", src: "Google I/O, May 2026", href: "https://blog.google/innovation-and-ai/sundar-pichai-io-2026/" },
  { to: 1, dec: 0, suf: "B+", text: "monthly users of Google's AI Mode", src: "Google I/O, May 2026", href: "https://blog.google/innovation-and-ai/sundar-pichai-io-2026/" },
  { to: 900, dec: 0, suf: "M+", text: "people use the Gemini app every month", src: "Google I/O, May 2026", href: "https://blog.google/innovation-and-ai/sundar-pichai-io-2026/" },
];

const ease = (x) => 1 - Math.pow(1 - x, 3);

export default function StatsBand() {
  const ref = useRef(null);

  useEffect(() => {
    const box = ref.current;
    if (!box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...box.querySelectorAll(".band-n")];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const s = STATS[Number(e.target.dataset.i)];
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min(1, (now - start) / 1400);
            e.target.textContent = (s.to * ease(p)).toFixed(s.dec) + s.suf;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      { threshold: 0.6 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="band" aria-labelledby="bandTitle" ref={ref}>
      <Constellation cy={0.52} scale={0.3} maxSize={380} link={0.36} alpha={0.38} extra={34} restart />
      <div className="band-in">
        <p className="eyebrow">The shift has already happened</p>
        <h2 id="bandTitle">
          Billions now ask AI what to buy.
          <br />
          <span>Make sure it can see you.</span>
        </h2>
        <div className="band-stats">
          {STATS.map((s, i) => (
            <div className="card band-stat" key={i}>
              <span className="band-n" data-i={i}>
                {s.to.toFixed(s.dec) + s.suf}
              </span>
              <span className="band-t">{s.text}</span>
              <span className="band-s">
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.src}
                </a>
              </span>
            </div>
          ))}
        </div>
        <a className="cta-pill" href="#check">
          Check if AI recommends you <span className="arrow" aria-hidden="true">↑</span>
        </a>
      </div>
    </section>
  );
}
