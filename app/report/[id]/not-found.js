export default function ReportNotFound() {
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
      <div className="card cta">
        <h3>We couldn't find that report</h3>
        <p className="muted">Reports are kept for 90 days, so this one may have expired. You can run a fresh check any time.</p>
        <a className="button" href="/#check">
          Check a store
        </a>
      </div>
    </main>
  );
}
