"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "./components/Footer";
import HomeInfo from "./components/HomeInfo";
import Script from "next/script";
import Report from "./components/Report";
import ChatDemo from "./components/ChatDemo";
import { loadRecent, saveRecent } from "./components/recent";

const BOT_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// General progress steps. They never reveal the actual searches being run.
function progressSteps(location) {
  return [
    "Reading your store through AI's eyes…",
    "Analysing your AI appeal…",
    "Understanding your customers…",
    location ? `Thinking like a shopper in ${location}…` : "Thinking like a shopper in your market…",
    "Scanning the competition…",
    "Seeing who AI recommends first…",
    "Finding where you could win…",
    "Building your report…",
  ];
}

const DID_YOU_KNOW = [
  "Shoppers often go with the first shop AI recommends.",
  "AI reads delivery times and returns policies when choosing who to recommend.",
  "Clear product details make it easier for AI to recommend you.",
  "AI assistants compare shops in seconds, not pages of search results.",
];

const STEP_MS = 6500;

const LOCATIONS = [
  "United Kingdom",
  "England",
  "Scotland",
  "Wales",
  "Northern Ireland",
  "London",
  "Manchester",
  "Ireland",
  "United States",
  "Canada",
  "Australia",
  "New Zealand",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Europe",
  "Worldwide",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [extra, setExtra] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [botToken, setBotToken] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [cachedNote, setCachedNote] = useState(false);
  const [recent, setRecent] = useState([]);
  const [fresh, setFresh] = useState(false);
  const [showFloat, setShowFloat] = useState(false);

  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const formRef = useRef(null);
  const extrasRef = useRef(null);

  useEffect(() => {
    window.onBotToken = (t) => setBotToken(t);
  }, []);

  // On load: free checks left, recent checks on this device, and any "Check again" details.
  useEffect(() => {
    fetch("/api/scan", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => typeof d.remaining === "number" && setRemaining(d.remaining))
      .catch(() => {});
    setRecent(loadRecent());

    const q = new URLSearchParams(window.location.search);
    if (q.get("website")) {
      setUrl(q.get("website") || "");
      setCategory(q.get("sell") || "");
      setLocation(q.get("loc") || "");
      setExtra(q.get("extra") || "");
      if (q.get("recheck") === "1") setFresh(true);
      setTimeout(() => window.scrollTo({ top: 320, behavior: "smooth" }), 300);
    }
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

      // Floating "Check my store" button once the form is well out of view.
      setShowFloat(window.scrollY > window.innerHeight + 520);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Progress while scanning.
  useEffect(() => {
    if (!loading) return;
    const steps = progressSteps(location).length;
    const start = Date.now();
    setStep(0);
    setProgress(2);
    const t = setInterval(() => {
      const ms = Date.now() - start;
      setStep(Math.min(steps - 1, Math.floor(ms / STEP_MS)));
      setProgress(Math.min(95, Math.round(100 * (1 - Math.exp(-ms / 22000)))));
    }, 250);
    return () => clearInterval(t);
  }, [loading, location]);

  const toForm = (e) => {
    e?.preventDefault();
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  async function runScan(details, isFresh) {
    setError("");
    setResult(null);
    setCachedNote(false);
    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, botToken, fresh: Boolean(isFresh) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setProgress(100);
      setResult(data);
      setCachedNote(Boolean(data.cached));
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      setRecent(saveRecent(data));
      setFresh(false);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (err) {
      setError(err.message);
      if (/free (scan|check)/i.test(err.message)) setRemaining(0);
    } finally {
      setLoading(false);
      if (BOT_KEY && window.turnstile) {
        window.turnstile.reset();
        setBotToken("");
      }
    }
  }

  function scan(e) {
    e.preventDefault();
    runScan({ url, category, location, extra }, fresh);
  }

  // "Check again" from the report: same details, skipping today's saved result.
  function recheck(r) {
    const details = { url: r.shop.domain, category: r.category || category, location: r.location || "", extra: r.extra || "" };
    setUrl(details.url);
    setCategory(details.category);
    setLocation(details.location);
    setExtra(details.extra);
    window.scrollTo({ top: 320, behavior: "smooth" });
    runScan(details, true);
  }

  const steps = progressSteps(location);

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
            <span className="tag">Free check in under 60 seconds</span>
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
              {["Free check", "Under 60 seconds", "No account needed"].map((c) => (
                <li key={c}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {c}
                </li>
              ))}
            </ul>
            <a className="cta-pill" href="#top" onClick={toForm}>
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
                Location <span className="optional">Optional</span>
              </span>
              <input
                type="text"
                list="locations"
                placeholder="e.g. United Kingdom, London, USA or Worldwide"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={60}
                disabled={loading}
                autoComplete="off"
              />
              <datalist id="locations">
                {LOCATIONS.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </label>
            <label>
              <span>
                Additional information <span className="optional">Optional</span>
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
              {loading ? "Checking…" : fresh ? "Check again" : "Check my store"}
            </button>

            {loading && (
              <div className="progress" aria-live="polite">
                <div className="progress-top">
                  <span className="progress-step" key={step}>
                    {steps[step]}
                  </span>
                  <span className="progress-pct">{progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="progress-tip">
                  <b>Did you know?</b> {DID_YOU_KNOW[Math.floor(step / 2) % DID_YOU_KNOW.length]}
                </p>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            {!loading && (remaining !== null || cachedNote) && (
              <p className="hint checks-left">
                {cachedNote ? "Showing your result from earlier today. " : ""}
                {remaining !== null &&
                  (remaining > 0
                    ? `${remaining} free ${remaining === 1 ? "check" : "checks"} left today`
                    : "No free checks left today. Come back tomorrow!")}
              </p>
            )}

            {!loading && recent.length > 0 && (
              <div className="recent">
                <span className="recent-label">Your recent checks:</span>
                {recent.slice(0, 3).map((r) => (
                  <a key={r.id} href={`/report/${r.id}`} className="recent-item">
                    {r.name} <b>{r.overall}</b>
                  </a>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      <ChatDemo />

      <a className={`float-cta${showFloat ? " show" : ""}`} href="#top" onClick={toForm} tabIndex={showFloat ? 0 : -1} aria-hidden={!showFloat}>
        Check my store ↑
      </a>

      {result && <Report report={result} onRecheck={loading ? null : () => recheck(result)} />}

      <HomeInfo />

      <Footer />
    </>
  );
}
