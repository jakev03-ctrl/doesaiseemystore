"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Report from "./components/Report";

const BOT_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const LOADING = [
  "Opening your store…",
  "Reading your products…",
  "Thinking like a shopper…",
  "Asking AI assistants what they'd recommend…",
  "Checking who gets mentioned…",
  "Still searching, nearly there…",
  "Adding up your score…",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [botToken, setBotToken] = useState("");

  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const formRef = useRef(null);
  const cueRef = useRef(null);

  useEffect(() => {
    window.onBotToken = (t) => setBotToken(t);
  }, []);

  // Scroll intro: big title shrinks to the top, form slides in.
  useEffect(() => {
    function update() {
      const hero = heroRef.current;
      const title = titleRef.current;
      const sub = subRef.current;
      const form = formRef.current;
      const cue = cueRef.current;
      if (!hero || !title || !sub || !form || !cue) return;

      const small = window.innerWidth < 640;
      const p = Math.max(0, Math.min(1, window.scrollY / 280));
      const e = 1 - Math.pow(1 - p, 3);
      const lerp = (a, b) => a + (b - a) * e;

      hero.style.marginTop = lerp(window.innerHeight * 0.26, 16) + "px";
      title.style.fontSize = lerp(small ? 54 : 112, small ? 36 : 58) + "px";
      sub.style.fontSize = lerp(small ? 19 : 25, small ? 16 : 19) + "px";
      sub.style.marginTop = lerp(26, 12) + "px";

      const f = Math.max(0, Math.min(1, (p - 0.25) / 0.75));
      form.style.opacity = String(f);
      form.style.transform = `translateY(${(1 - f) * 60}px)`;
      form.style.pointerEvents = f > 0.5 ? "auto" : "none";
      cue.style.opacity = String(Math.max(0, 1 - p * 3));
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, LOADING.length - 1)), 9000);
    return () => clearInterval(t);
  }, [loading]);

  async function scan(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, category, botToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (BOT_KEY && window.turnstile) {
        window.turnstile.reset();
        setBotToken("");
      }
    }
  }

  return (
    <>
      {BOT_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}

      <div className="track">
        <div className="stage">
          <header className="top">
            <a href="/" className="logo">
              DoesAI<b>See</b>MyStore
            </a>
            <span className="tag">Free check · about a minute</span>
          </header>

          <div className="hero" ref={heroRef}>
            <h1 ref={titleRef}>
              Does AI <span className="see">see</span> your store?
            </h1>
            <p className="sub" ref={subRef}>
              More shoppers now ask AI assistants like ChatGPT what to buy. Find out if they
              recommend you, or your competitors instead.
            </p>
          </div>

          <form className="card form" ref={formRef} onSubmit={scan} style={{ opacity: 0 }}>
            <label>
              Your store's website
              <input
                type="text"
                inputMode="url"
                placeholder="e.g. mystore.co.uk"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            <label>
              What do you sell?
              <input
                type="text"
                placeholder="e.g. scented candles"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                maxLength={80}
                disabled={loading}
              />
              <span className="hint">Be specific: "scented candles" works better than "lifestyle".</span>
            </label>

            {BOT_KEY && <div className="cf-turnstile" data-sitekey={BOT_KEY} data-callback="onBotToken" data-theme="dark" />}

            <button type="submit" disabled={loading || Boolean(BOT_KEY && !botToken)}>
              {loading ? "Checking…" : "Check my store"}
            </button>
            {loading && (
              <div className="loading" aria-live="polite">
                <span className="dot" />
                {LOADING[step]}
              </div>
            )}
            {error && <p className="error">{error}</p>}
            {result && typeof result.remaining === "number" && (
              <p className="hint">
                {result.cached ? "Showing a result from earlier today. " : ""}
                {result.remaining} free {result.remaining === 1 ? "scan" : "scans"} left today.
              </p>
            )}
          </form>

          <div className="cue" ref={cueRef}>
            <span>Scroll to check your store</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {result && <Report report={result} />}

      <footer>
        © {new Date().getFullYear()} DoesAISeeMyStore · <a href="/privacy">Privacy</a>
      </footer>
    </>
  );
}
