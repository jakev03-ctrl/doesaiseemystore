"use client";

import { useEffect, useRef } from "react";

// Slowly drifting, twinkling stars behind every page.
export default function Starfield() {
  const ref = useRef(null);

  useEffect(() => {
    const sky = ref.current;
    if (!sky) return;
    const ctx = sky.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars = [];
    let w = 0;
    let h = 0;
    let frame = 0;

    function makeStars() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      sky.width = w * dpr;
      sky.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 2600);
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.3 + depth * 1.2,
          speed: 0.02 + depth * 0.12,
          base: 0.25 + depth * 0.6,
          tw: Math.random() * Math.PI * 2,
          twSpeed: 0.005 + Math.random() * 0.02,
          blue: Math.random() < 0.25,
        };
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const lift = window.scrollY * 0.05;
      for (const s of stars) {
        if (!still) {
          s.x -= s.speed;
          s.tw += s.twSpeed;
          if (s.x < -2) {
            s.x = w + 2;
            s.y = Math.random() * h;
          }
        }
        const a = s.base * (0.65 + 0.35 * Math.sin(s.tw));
        const y = (((s.y - lift * (0.3 + s.speed * 4)) % h) + h) % h;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.blue ? `rgba(170, 195, 255, ${a})` : `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      }
      if (!still) frame = requestAnimationFrame(draw);
    }

    const onResize = () => {
      makeStars();
      if (still) draw();
    };
    const onScroll = () => draw();

    makeStars();
    draw();
    window.addEventListener("resize", onResize);
    if (still) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="sky" aria-hidden="true" />
      <div className="glow" aria-hidden="true" />
    </>
  );
}
