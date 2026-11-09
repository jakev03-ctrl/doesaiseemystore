"use client";

import { useEffect, useRef } from "react";

// Drifting stars that gather into the outline of a shopping bag, linked by faint lines.
// Only animates while it's on screen, and stays still for people who prefer less motion.
function bagPoints(cx, cy, s) {
  const p = [];
  const add = (x, y) => p.push([cx + x * s, cy + y * s]);
  for (let i = 0; i <= 8; i++) add(-1 + i * 0.25, -0.3);
  for (let i = 1; i <= 8; i++) add(1 + (0.12 * i) / 8, -0.3 + i * 0.16);
  for (let i = 1; i <= 8; i++) add(1.12 - i * 0.28, 1);
  for (let i = 1; i < 8; i++) add(-1.12 + (0.12 * i) / 8, 1 - i * 0.1625);
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i * Math.PI) / 8;
    add(0.42 * Math.cos(a), -0.3 + 0.5 * Math.sin(a));
  }
  return p;
}

const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

export default function Constellation({ cx = 0.5, cy = 0.5, scale = 0.34, maxSize = 460, link = 0.34, alpha = 0.32, extra = 30, restart = false, className = "const" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let size = 0;
    let pts = [];
    let loose = [];
    let on = false;
    let t0 = performance.now();
    let last = 0;
    let frame = 0;

    function layout() {
      const r = canvas.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = W * d;
      canvas.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      size = Math.min(W * scale, H * (scale + 0.02), maxSize);
      const X = W * cx;
      const Y = H * cy;
      let seed = 7;
      const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      pts = bagPoints(X, Y, size).map(([x, y]) => ({ tx: x + (rnd() - 0.5) * size * 0.06, ty: y + (rnd() - 0.5) * size * 0.06, sx: rnd() * W, sy: rnd() * H, ph: rnd() * 6.28 }));
      loose = Array.from({ length: extra }, () => ({ x: X + (rnd() - 0.5) * size * 4.2, y: Y + (rnd() - 0.5) * size * 3.4, ph: rnd() * 6.28 }));
      draw(still ? 1e9 : performance.now());
    }

    function draw(now) {
      const t = (now - t0) / 1000;
      const light = document.documentElement.dataset.theme === "light";
      const form = still ? 1 : ease((t - 0.3) / 3);
      ctx.clearRect(0, 0, W, H);
      const P = pts.map((p) => [
        p.sx + (p.tx - p.sx) * form + (still ? 0 : Math.sin(t * 0.6 + p.ph) * 3),
        p.sy + (p.ty - p.sy) * form + (still ? 0 : Math.cos(t * 0.5 + p.ph) * 3),
      ]);
      const E = loose.map((e) => [e.x + (still ? 0 : Math.sin(t * 0.3 + e.ph) * 8), e.y + (still ? 0 : Math.cos(t * 0.25 + e.ph) * 8)]);
      const all = P.concat(E);
      const lim = link * size;
      const lc = light ? "63,111,232" : "140,175,255";
      const a0 = alpha * (light ? 0.75 : 1);
      ctx.lineWidth = 1;
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const dd = Math.hypot(all[i][0] - all[j][0], all[i][1] - all[j][1]);
          if (dd >= lim) continue;
          const k = (1 - dd / lim) * a0 * (i < P.length && j < P.length ? form : 0.5);
          if (k <= 0.01) continue;
          ctx.strokeStyle = `rgba(${lc},${k})`;
          ctx.beginPath();
          ctx.moveTo(all[i][0], all[i][1]);
          ctx.lineTo(all[j][0], all[j][1]);
          ctx.stroke();
        }
      }
      all.forEach(([x, y], i) => {
        const tw = still ? 1 : 0.7 + 0.3 * Math.sin(t * 2 + i);
        ctx.fillStyle = light ? `rgba(63,111,232,${0.6 * tw})` : i % 5 ? `rgba(200,215,255,${0.85 * tw})` : `rgba(130,170,255,${tw})`;
        ctx.shadowColor = light ? "transparent" : "rgba(140,175,255,.9)";
        ctx.shadowBlur = light ? 0 : 8;
        ctx.beginPath();
        ctx.arc(x, y, i % 5 ? 1.5 : 2.5, 0, 6.283);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    function loop(now) {
      if (!on) return;
      frame = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      draw(now);
    }

    layout();
    const io = new IntersectionObserver(([e]) => {
      const was = on;
      on = e.isIntersecting && !still;
      if (on && !was) {
        if (restart) t0 = performance.now();
        frame = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);
    const onTheme = () => draw(still ? 1e9 : performance.now());
    window.addEventListener("resize", layout);
    window.addEventListener("themechange", onTheme);
    return () => {
      on = false;
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("resize", layout);
      window.removeEventListener("themechange", onTheme);
    };
  }, [cx, cy, scale, maxSize, link, alpha, extra, restart]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
