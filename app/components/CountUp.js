"use client";

import { useEffect, useRef, useState } from "react";

// Shows a stat like "393%" or "1 in 2". The real number is always in the page
// (so Google and AI read it correctly). For visitors, it counts up when it scrolls into view.
export default function CountUp({ text, duration = 1400 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(text);
  const [phase, setPhase] = useState("ready"); // ready | waiting | done

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen when the page loads? Just show it.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;

    setPhase("waiting");
    let frame;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const e = 1 - Math.pow(1 - p, 3);
          setShown(text.replace(/\d+/g, (n) => String(Math.max(1, Math.round(Number(n) * e)))));
          if (p < 1) frame = requestAnimationFrame(tick);
          else {
            setShown(text);
            setPhase("done");
          }
        };
        setPhase("done");
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, duration]);

  return (
    <div ref={ref} className={`stat-big${phase === "waiting" ? " waiting" : ""}${phase === "done" ? " in" : ""}`}>
      {shown}
    </div>
  );
}
