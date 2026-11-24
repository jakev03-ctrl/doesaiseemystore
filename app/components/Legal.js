import Footer from "./Footer";

// Shared layout for the privacy and terms pages: a plain-English summary up top,
// a contents list that stays in view on wide screens, and numbered sections.
export default function Legal({ kind, title, intro, updated, summary, sections, email }) {
  return (
    <main className="wrap">
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="/news">News</a>
        </nav>
      </header>

      <div className="legal">
        <header className="legal-hero">
          <p className="legal-eyebrow">{kind}</p>
          <h1>{title}</h1>
          <p className="legal-intro">{intro}</p>
          <p className="legal-meta">
            Last updated {updated} · <a href={kind === "Privacy" ? "/terms" : "/privacy"}>{kind === "Privacy" ? "Terms of use" : "Privacy notice"}</a>
          </p>
        </header>

        <div className="legal-grid">
          <nav className="legal-toc" aria-label="On this page">
            <p>On this page</p>
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="legal-body">
            <section className="legal-short" aria-label="The short version">
              <h2>The short version</h2>
              <ul>
                {summary.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>

            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="legal-sec">
                <h2>
                  <span className="legal-n">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}

            <aside className="legal-ask">
              <div>
                <h2>Anything unclear?</h2>
                <p>Get in touch and you'll get a straight answer from a real person, not a bot.</p>
              </div>
              <span className="legal-ask-btns">
                <a className="legal-btn" href={`mailto:${email}`}>{email}</a>
                <a className="legal-btn ghost" href="/contact">Contact page</a>
              </span>
            </aside>
          </article>
        </div>
      </div>

      <Footer />
    </main>
  );
}
