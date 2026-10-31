"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    window.onBotToken = (t) => setBotToken(t);
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
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
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
    <main>
      {BOT_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}

      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
      </header>

      <section className="hero">
        <p className="eyebrow">Free check · takes about a minute</p>
        <h1>Does AI see your store?</h1>
        <p className="lead">
          More shoppers now ask AI assistants like ChatGPT what to buy. Find out if they recommend
          you, or your competitors instead.
        </p>

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
              placeholder="e.g. handmade soy candles"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              maxLength={80}
              disabled={loading}
            />
            <span className="hint">Be specific: "scented candles" works better than "lifestyle".</span>
          </label>

          {BOT_KEY && <div className="cf-turnstile" data-sitekey={BOT_KEY} data-callback="onBotToken" />}

          <button type="submit" disabled={loading || (BOT_KEY && !botToken)}>
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
      </section>

      {result && <Report report={result} />}

      <footer>
        © {new Date().getFullYear()} DoesAISeeMyStore · <a href="/privacy">Privacy</a>
      </footer>
    </main>
  );
}
