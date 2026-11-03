"use client";

import { useEffect, useRef, useState } from "react";

// Shows a stat like "393%" or "1 in 2". Numbers count up from 0 when it scrolls into view.
export default function CountUp({ text, duration = 1400 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(text.replace(/\d+/g, "0"));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      setVisible(true);
      return;
    }
    let frame;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setVisible(true);
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const e = 1 - Math.pow(1 - p, 3);
          setShown(text.replace(/\d+/g, (n) => String(Math.round(Number(n) * e)).replace(/^0$/, p > 0.05 ? "1" : "0")));
          if (p < 1) frame = requestAnimationFrame(tick);
          else setShown(text);
        };
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
    <div ref={ref} className={`stat-big${visible ? " in" : ""}`} aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </div>
  );
}
