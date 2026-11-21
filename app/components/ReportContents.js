"use client";

// The report's contents: 5 cards under the score (each with its headline result) that jump to a
// section, and a slim bar that stays at the top while scrolling and highlights the section you're in.
import { useEffect, useRef, useState } from "react";

function jump(e, id) {
  const el = typeof document !== "undefined" && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    history.replaceState(null, "", `#${id}`);
  } catch {}
}

export default function ReportContents({ items }) {
  const boxRef = useRef(null);
  const barRef = useRef(null);
  const [showBar, setShowBar] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // The bar appears once the contents cards have scrolled out of view.
    const box = boxRef.current;
    const o1 = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    if (box) o1.observe(box);
    // Highlight the section nearest the top of the screen.
    const els = items.map((it) => document.getElementById(it.id)).filter(Boolean);
    const seen = new Map();
    const o2 = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null);
        const visible = [...seen.entries()].filter(([, t]) => t !== null).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]));
        if (visible.length) setActive(visible[0][0]);
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => o2.observe(el));
    return () => {
      o1.disconnect();
      o2.disconnect();
    };
  }, [items]);

  // On a narrow screen, keep the highlighted section visible inside the bar (without moving the page).
  useEffect(() => {
    const bar = barRef.current;
    const on = bar && bar.querySelector("a.on");
    if (on && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: on.offsetLeft - 12, behavior: "smooth" });
  }, [active]);

  if (!items.length) return null;
  return (
    <>
      <nav className="rv-card rv-toc no-print" ref={boxRef} aria-label="In this report">
        <div className="rv-toc-h">In this report</div>
        <div className="rv-toc-row">
          {items.map((it, i) => (
            <a key={it.id} href={`#${it.id}`} className="rv-toc-card" onClick={(e) => jump(e, it.id)}>
              <span className="rv-toc-t">
                <span className="rv-toc-n">{i + 1}</span>
                <span>{it.title}</span>
              </span>
              {it.chip && <span className={`rv-toc-chip ${it.tone || "info"}`}>{it.chip}</span>}
              <span className="rv-toc-go">Jump to section ↓</span>
            </a>
          ))}
        </div>
      </nav>
      <div className={`rv-tocbar no-print${showBar ? " on" : ""}`} aria-hidden={!showBar}>
        <div className="rv-tocbar-in" ref={barRef}>
          {items.map((it, i) => (
            <a key={it.id} href={`#${it.id}`} tabIndex={showBar ? 0 : -1} className={active === it.id ? "on" : ""} onClick={(e) => jump(e, it.id)}>
              <span className="n">{i + 1}</span>
              {it.short}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
