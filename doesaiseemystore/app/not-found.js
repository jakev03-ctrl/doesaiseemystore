export default function NotFound() {
  return (
    <main>
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
      </header>
      <div className="card cta">
        <h3>We couldn't find that page</h3>
        <p className="muted">Reports are kept for 90 days, so this one may have expired.</p>
        <a className="button" href="/">
          Check a store
        </a>
      </div>
    </main>
  );
}
