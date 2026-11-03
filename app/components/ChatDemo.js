"use client";

import { useEffect, useState } from "react";

// A small looping demo in the bottom-left corner: a shopper asks AI a question,
// and AI replies with shop recommendations. All shop names are made up.
const EXAMPLES = [
  { q: "Best soy candles under £30?", shops: ["Wick & Ember", "Hollow Oak Candles", "Is it you?"] },
  { q: "Comfy running shoes for beginners?", shops: ["Stride Lab", "Northpace", "Is it you?"] },
  { q: "Healthy treats for a puppy?", shops: ["Good Paws Co.", "Barkery Bakes", "Is it you?"] },
];

const TYPE_MS = 45;

export default function ChatDemo() {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [stage, setStage] = useState("typing"); // typing → thinking → answer
  const [hidden, setHidden] = useState(false);

  // Hide once the visitor starts scrolling (it fades with the headline).
  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ex = EXAMPLES[i];
    let timers = [];
    if (reduce) {
      setTyped(ex.q);
      setStage("answer");
      timers.push(setTimeout(() => setI((n) => (n + 1) % EXAMPLES.length), 7000));
      return () => timers.forEach(clearTimeout);
    }
    setTyped("");
    setStage("typing");
    ex.q.split("").forEach((_, n) => {
      timers.push(setTimeout(() => setTyped(ex.q.slice(0, n + 1)), 600 + n * TYPE_MS));
    });
    const typedAt = 600 + ex.q.length * TYPE_MS;
    timers.push(setTimeout(() => setStage("thinking"), typedAt + 300));
    timers.push(setTimeout(() => setStage("answer"), typedAt + 1500));
    timers.push(setTimeout(() => setI((n) => (n + 1) % EXAMPLES.length), typedAt + 6000));
    return () => timers.forEach(clearTimeout);
  }, [i]);

  const ex = EXAMPLES[i];

  return (
    <aside className={`chat-demo${hidden ? " gone" : ""}`} aria-hidden="true">
      <div className="chat-head">
        <span className="chat-dot" /> AI shopping assistant
      </div>
      <div className="bubble me">
        {typed}
        {stage === "typing" && <span className="caret" />}
      </div>
      {stage === "thinking" && (
        <div className="bubble ai thinking">
          <span />
          <span />
          <span />
        </div>
      )}
      {stage === "answer" && (
        <div className="bubble ai">
          Here are my top picks:
          <ol>
            {ex.shops.map((s, n) => (
              <li key={s} className={n === ex.shops.length - 1 ? "you" : ""} style={{ animationDelay: `${n * 0.25}s` }}>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </aside>
  );
}
