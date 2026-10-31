"use client";

import { useEffect, useState } from "react";

const LOADING = [
  "Opening your store…",
  "Reading your products…",
  "Thinking like a shopper…",
  "Asking AI what it would recommend…",
  "Checking who gets mentioned…",
  "Adding up your score…",
];

function Ring({ value }) {
  const colour = value >= 70 ? "var(--good)" : value >= 40 ? "var(--mid)" : "var(--bad)";
  return (
    <div className="ring" style={{ "--v": value, "--c": colour }}>
      <div className="ring-inner">
        <span className="ring-num">{value}</span>
        <span className="ring-of">/100</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, LOADING.length - 1)), 7000);
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
        body: JSON.stringify({ url, category }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="top">
        <span className="logo">
          DoesAI<b>See</b>MyStore
        </span>
      </header>

      <section className="hero">
        <p className="eyebrow">Free check · takes about a minute</p>
        <h1>Does AI see your store?</h1>
        <p className="lead">
          More shoppers now ask AI assistants what to buy. Find out if they recommend you, or your
          competitors instead.
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
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Checking…" : "Check my store"}
          </button>
          {loading && (
            <div className="loading" aria-live="polite">
              <span className="dot" />
              {LOADING[step]}
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </form>
      </section>

      {result && (
        <section id="results" className="results">
          <div className="card score">
            <Ring value={result.overall} />
            <div>
              <p className="eyebrow">{result.shop.name}</p>
              <h2>{result.label}</h2>
              <p>
                Your store appeared in <b>{result.appeared}</b> of <b>{result.total}</b> AI shopping
                searches.
              </p>
            </div>
          </div>

          <div className="card">
            <h3>The searches we tested</h3>
            <ul className="qs">
              {result.questions.map((q, i) => (
                <li key={i} className={q.ok ? (q.found ? "yes" : "no") : "skip"}>
                  <span className="mark">{q.ok ? (q.found ? "✓" : "✕") : "–"}</span>
                  <span>“{q.question}”</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid">
            <div className="card">
              <h3>Who AI recommends instead</h3>
              {result.competitors.length ? (
                <ol className="comp">
                  {result.competitors.map((c, i) => (
                    <li key={i}>
                      <span>{c.name}</span>
                      <span className="count">
                        {c.count} {c.count === 1 ? "mention" : "mentions"}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">No clear competitors came up this time.</p>
              )}
            </div>

            <div className="card">
              <h3>
                Product info score <span className="pill">{result.dataScore}/100</span>
              </h3>
              <p className="muted">{result.summary}</p>
            </div>
          </div>

          <div className="card">
            <h3>Your top fixes</h3>
            <ol className="fixes">
              {result.fixes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ol>
          </div>

          <p className="note">
            AI answers change from search to search, so this is a snapshot, not a guarantee. Run it
            again after making changes to see how you improve.
          </p>
        </section>
      )}

      <footer>© {new Date().getFullYear()} DoesAISeeMyStore</footer>
    </main>
  );
}
