"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "./components/Footer";
import HomeInfo from "./components/HomeInfo";
import Script from "next/script";
import Report from "./components/Report";
import ChatDemo from "./components/ChatDemo";
import { loadRecent, saveRecent } from "./components/recent";
import { runScanJob, pendingJob, waitForJob } from "./components/scanClient";

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
  const extrasRef = useRef(null);
  const vidWrapRef = useRef(null);
  const vidRef = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [videoFailed, setVideoFailed] = useState(false);

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

    // Pick the video that matches the light/dark theme, and follow the switch.
    const readTheme = () => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    readTheme();
    window.addEventListener("themechange", readTheme);

    // A check that was still running when they left: pick it up again.
    const job = pendingJob();
    if (job) {
      setLocation(job.location || "");
      setLoading(true);
      setTimeout(() => document.getElementById("check")?.scrollIntoView({ behavior: "smooth" }), 300);
      waitForJob(job)
        .then(showResult)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }

    const q = new URLSearchParams(window.location.search);
    if (q.get("website")) {
      setUrl(q.get("website") || "");
      setCategory(q.get("sell") || "");
      setLocation(q.get("loc") || "");
      setExtra(q.get("extra") || "");
      if (q.get("recheck") === "1") setFresh(true);
      setTimeout(() => document.getElementById("check")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
    return () => window.removeEventListener("themechange", readTheme);
  }, []);

  // Scroll intro: the big title shrinks to the top, the video rises in and plays,
  // then fades away as the form comes up. Runs at most once per frame.
  useEffect(() => {
    let ticking = false;
    let floatShown = false;
    let playing = false;

    function update() {
      ticking = false;
      const hero = heroRef.current;
      const title = titleRef.current;
      const sub = subRef.current;
      const extras = extrasRef.current;
      const wrap = vidWrapRef.current;
      const vid = vidRef.current;
      if (!hero || !title || !sub || !extras || !wrap) return;
      const y = window.scrollY;
      const small = window.innerWidth < 640;

      const formTop = document.getElementById("check")?.getBoundingClientRect().top ?? 9999;
      const wantFloat = formTop < -420;
      if (wantFloat !== floatShown) {
        floatShown = wantFloat;
        setShowFloat(wantFloat);
      }
      if (y > window.innerHeight + 1400) return; // intro is off screen: nothing to do

      const p = Math.max(0, Math.min(1, y / 320));
      const e = 1 - Math.pow(1 - p, 3);
      const lerp = (a, b) => a + (b - a) * e;
      hero.style.marginTop = lerp(window.innerHeight * 0.2, 4) + "px";
      title.style.fontSize = lerp(small ? 54 : 104, small ? 30 : 46) + "px";
      sub.style.fontSize = lerp(small ? 18 : 22, small ? 14 : 16) + "px";
      sub.style.marginTop = lerp(26, 8) + "px";
      extras.style.opacity = String(Math.max(0, 1 - p * 2.5));
      extras.style.pointerEvents = p < 0.3 ? "auto" : "none";
      extras.style.maxHeight = lerp(220, 0) + "px";
      extras.style.marginTop = lerp(24, 0) + "px";

      // The video: in from 140px of scrolling, out from 1000px.
      const vin = Math.max(0, Math.min(1, (y - 140) / 300));
      const vout = Math.max(0, Math.min(1, (y - 1000) / 250));
      const top = hero.getBoundingClientRect().bottom + 8;
      wrap.style.top = top + "px";
      wrap.style.opacity = String(vin * (1 - vout));
      wrap.style.transform = `translateX(-50%) translateY(${(1 - vin) * 60 - vout * 80}px) scale(${0.9 + 0.1 * (1 - Math.pow(1 - vin, 3))})`;
      wrap.style.pointerEvents = vin > 0.5 && vout < 0.5 ? "auto" : "none";
      const show = vin > 0.6 && vout < 0.5;
      if (vid && show && !playing) {
        playing = true;
        try {
          vid.currentTime = 0;
        } catch {}
        const pr = vid.play();
        if (pr && pr.catch) pr.catch(() => setVideoFailed(true));
      } else if (vid && !show && playing) {
        playing = false;
        vid.pause();
      }
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
    document.getElementById("check")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  function showResult(data) {
    setProgress(100);
    setResult(data);
    setCachedNote(Boolean(data.cached));
    if (typeof data.remaining === "number") setRemaining(data.remaining);
    setRecent(saveRecent(data));
    setFresh(false);
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  async function runScan(details, isFresh) {
    setError("");
    setResult(null);
    setCachedNote(false);
    setLoading(true);
    try {
      const data = await runScanJob({ ...details, botToken, fresh: Boolean(isFresh) });
      showResult(data);
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
    toForm();
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
              When shoppers ask AI assistants what to buy, we check if your shop comes up, show you who
              gets picked instead, and tell you exactly what to fix.
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
            <a className="cta-pill" href="#check" onClick={toForm}>
              Find out in 60 seconds <span className="arrow" aria-hidden="true">↓</span>
            </a>
            <span className="scroll-cue" aria-hidden="true">
              Scroll to see it in action ↓
            </span>
          </div>

          <div className="vidwrap" ref={vidWrapRef} onClick={toForm} role="button" tabIndex={-1} aria-label="See how it works. Click to go to the check form.">
            {videoFailed ? (
              <img src={`/media/how-it-works-${theme}.jpg`} alt="A DoesAISeeMyStore report: your AI score, who AI picks instead, key stats and what to fix" />
            ) : (
              <video
                ref={vidRef}
                key={theme}
                src={`/media/how-it-works-${theme}.mp4`}
                poster={`/media/how-it-works-${theme}-start.jpg`}
                muted
                playsInline
                preload="metadata"
                aria-label="A 10 second demo: enter your store, then see your AI score, who AI picks instead, key stats and what to fix"
                onError={() => setVideoFailed(true)}
              />
            )}
          </div>
        </div>
      </div>

      <section id="check" className="formsec">
        <h2 className="formsec-title">Check your store</h2>
          <form className="card form" onSubmit={scan}>
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
      </section>

      <ChatDemo />

      <a className={`float-cta${showFloat ? " show" : ""}`} href="#check" onClick={toForm} tabIndex={showFloat ? 0 : -1} aria-hidden={!showFloat}>
        Check my store ↑
      </a>

      {result && <Report report={result} onRecheck={loading ? null : () => recheck(result)} />}

      <HomeInfo />

      <Footer />
    </>
  );
}
