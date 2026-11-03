"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "./components/Footer";
import HomeInfo from "./components/HomeInfo";
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
  const [extra, setExtra] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [botToken, setBotToken] = useState("");

  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const formRef = useRef(null);
  const extrasRef = useRef(null);

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
      const extras = extrasRef.current;
      if (!hero || !title || !sub || !form || !extras) return;

      const small = window.innerWidth < 640;
      const p = Math.max(0, Math.min(1, window.scrollY / 280));
      const e = 1 - Math.pow(1 - p, 3);
      const lerp = (a, b) => a + (b - a) * e;

      hero.style.marginTop = lerp(window.innerHeight * 0.2, 4) + "px";
      title.style.fontSize = lerp(small ? 54 : 104, small ? 32 : 48) + "px";
      sub.style.fontSize = lerp(small ? 18 : 22, small ? 15 : 17) + "px";
      sub.style.marginTop = lerp(26, 10) + "px";

      const f = Math.max(0, Math.min(1, (p - 0.25) / 0.75));
      form.style.opacity = String(f);
      form.style.transform = `translateY(${(1 - f) * 60}px)`;
      form.style.pointerEvents = f > 0.5 ? "auto" : "none";
      extras.style.opacity = String(Math.max(0, 1 - p * 2.5));
      extras.style.pointerEvents = p < 0.3 ? "auto" : "none";
      extras.style.maxHeight = lerp(220, 0) + "px";
      extras.style.marginTop = lerp(24, 0) + "px";
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
        body: JSON.stringify({ url, category, location, extra, botToken }),
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
        <span id="top" className="form-anchor" aria-hidden="true" />
        <div className="stage">
          <header className="top">
            <a href="/" className="logo">
              DoesAI<b>See</b>MyStore
            </a>
            <nav className="topnav" aria-label="Main">
              <a href="/news">News</a>
            </nav>
            <span className="tag">Free check · in 60 seconds</span>
          </header>

          <div className="hero" ref={heroRef}>
            <h1 ref={titleRef}>
              Does AI <span className="see">see</span> your store?
            </h1>
            <p className="sub" ref={subRef}>
              AI is becoming a new way for customers to find stores. Find out where you stand, and
              how you could open up a whole new stream of customers.
            </p>
          </div>

          <div className="extras" ref={extrasRef}>
            <ul className="chips" aria-label="What you get">
              {["Free check", "No sign-up", "No account", "Under 60 seconds"].map((c) => (
                <li key={c}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {c}
                </li>
              ))}
            </ul>
            <a
              className="cta-pill"
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 320, behavior: "smooth" });
              }}
            >
              Find out in 60 seconds <span className="arrow" aria-hidden="true">↓</span>
            </a>
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
            <label>
              <span>
                Where are your customers? <span className="optional">Optional</span>
              </span>
              <input
                type="text"
                placeholder="e.g. United Kingdom, London, USA or Worldwide"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={60}
                disabled={loading}
                autoComplete="country-name"
              />
            </label>
            <label>
              <span>
                Anything else? <span className="optional">Optional</span>
              </span>
              <input
                type="text"
                placeholder="e.g. eco-friendly, under £30, gifts for teenagers"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                maxLength={120}
                disabled={loading}
              />
              <span className="hint">Anything you'd like the searches to take into account, like style, price or who it's for.</span>
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

        </div>
      </div>

      {result && <Report report={result} />}

      <HomeInfo />

      <Footer />
    </>
  );
}
