import Footer from "../components/Footer";
import { NEWS } from "../../lib/news";

export const metadata = {
  title: "AI shopping news | DoesAISeeMyStore",
  description:
    "How AI assistants are changing the way people shop, and why it matters for online stores. A roundup from leading news and research sources.",
};

export default function NewsPage() {
  return (
    <>
      <main className="wrap">
        <header className="top">
          <a href="/" className="logo">
            DoesAI<b>See</b>MyStore
          </a>
          <nav className="topnav" aria-label="Main">
            <a href="/news" aria-current="page">
              News
            </a>
          </nav>
          <span className="tag">Free check · about a minute</span>
        </header>

        <div className="page-intro">
          <p className="eyebrow">News</p>
          <h1>The shift to AI shopping</h1>
          <p className="sub">
            More and more shoppers ask AI assistants what to buy. Here's what leading news outlets and
            researchers are saying, and why it matters for your store.
          </p>
        </div>

        <div className="news-list">
          {NEWS.map((a) => (
            <article className="card news-card" key={a.url}>
              <p className="news-meta">
                <span className="news-source">{a.source}</span>
                <span aria-hidden="true">·</span>
                <span>{a.date}</span>
              </p>
              <h2>{a.title}</h2>
              <p className="news-summary">{a.summary}</p>
              <p className="news-takeaway">
                <b>Why it matters:</b> {a.takeaway}
              </p>
              <a className="news-link" href={a.url} target="_blank" rel="noopener noreferrer">
                Read the full article on {a.source} <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>

        <p className="note">
          Summaries are written by DoesAISeeMyStore. All articles belong to their original publishers.
        </p>

        <div className="card cta">
          <h3>Is your store ready?</h3>
          <p className="muted">Find out if AI assistants recommend you, or your competitors instead.</p>
          <a className="button" href="/#top">
            Check my store, free
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
