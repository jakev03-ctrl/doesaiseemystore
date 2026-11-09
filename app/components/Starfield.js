"use client";

import { useEffect, useRef } from "react";

// Slowly drifting, twinkling stars behind every page.
const SPARKS = [
  [6, 18, 18, 0.28], [11, 26, 10, 0.22], [17, 22, 12, 0.2], [21, 31, 16, 0.25],
  [88, 12, 14, 0.25], [93, 30, 9, 0.2], [80, 70, 20, 0.26], [86, 64, 10, 0.2],
  [91, 72, 12, 0.22], [95, 66, 8, 0.18], [48, 6, 9, 0.18], [4, 78, 14, 0.22],
  [30, 88, 10, 0.18], [64, 92, 12, 0.2], [70, 40, 8, 0.14], [36, 52, 7, 0.12],
];
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
      const count = Math.min(420, Math.round((w * h) / 3600));
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

    // ~30 frames a second is plenty for slow-drifting stars, and halves the work.
    let lastDraw = 0;
    function loop(now) {
      frame = requestAnimationFrame(loop);
      if (document.hidden || now - lastDraw < 33) return;
      lastDraw = now;
      paint();
    }

    function draw() {
      paint();
    }

    function paint() {
      ctx.clearRect(0, 0, w, h);
      // Light theme: the same stars, turned down to soft blue-grey specks.
      const light = document.documentElement.dataset.theme === "light";
      const lift = window.scrollY * 0.05;
      const near = []; // light mode: the bigger stars, joined by faint lines for a little texture
      for (const s of stars) {
        if (!still) {
          s.x -= s.speed;
          s.tw += s.twSpeed;
          if (s.x < -2) {
            s.x = w + 2;
            s.y = Math.random() * h;
          }
        }
        const a = s.base * (0.65 + 0.35 * Math.sin(s.tw)) * (light ? 0.7 : 1);
        const y = (((s.y - lift * (0.3 + s.speed * 4)) % h) + h) % h;
        if (light && s.r > 1.05) near.push([s.x, y]);
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = light
          ? s.blue
            ? `rgba(90, 120, 220, ${a})`
            : `rgba(110, 125, 170, ${a})`
          : s.blue
            ? `rgba(170, 195, 255, ${a})`
            : `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      }
      if (light) {
        ctx.lineWidth = 1;
        for (let i = 0; i < near.length; i++) {
          for (let j = i + 1; j < near.length; j++) {
            const d = Math.hypot(near[i][0] - near[j][0], near[i][1] - near[j][1]);
            if (d < 110) {
              ctx.strokeStyle = `rgba(63, 111, 232, ${0.16 * (1 - d / 110)})`;
              ctx.beginPath();
              ctx.moveTo(near[i][0], near[i][1]);
              ctx.lineTo(near[j][0], near[j][1]);
              ctx.stroke();
            }
          }
        }
      }
    }

    const onResize = () => {
      makeStars();
      if (still) draw();
    };
    const onScroll = () => draw();
    const onTheme = () => still && draw();
    window.addEventListener("themechange", onTheme);

    makeStars();
    draw();
    if (!still) frame = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);
    if (still) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("themechange", onTheme);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="sky" aria-hidden="true" />
      <div className="glow" aria-hidden="true" />
      {/* Light mode: soft blue four-point sparkles and a faint constellation (hidden in dark mode). */}
      <div className="sparks" aria-hidden="true">
        <svg width="100%" height="100%" style={{ inset: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline className="c" fill="none" vectorEffect="non-scaling-stroke" points="6.5,19 11.4,26.6 17.5,22.7 21.6,32" />
          <polyline className="c" fill="none" vectorEffect="non-scaling-stroke" points="80.8,71.4 86.4,64.8 91.5,72.8 95.3,66.6" />
        </svg>
        {SPARKS.map(([x, y, size, o], i) => (
          <svg key={i} style={{ left: `${x}%`, top: `${y}%`, opacity: o }} width={size} height={size} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
          </svg>
        ))}
      </div>
    </>
  );
}
