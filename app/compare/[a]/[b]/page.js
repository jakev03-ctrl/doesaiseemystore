import { notFound } from "next/navigation";
import { getJSON } from "../../../../lib/store";
import { compareView } from "../../../../lib/report";
import Footer from "../../../components/Footer";

export const dynamic = "force-dynamic";

const clean = (id) => String(id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20);

async function load(id) {
  try {
    const r = await getJSON(`report:${clean(id)}`);
    return r ? compareView(r) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { a, b } = await params;
  const [x, y] = await Promise.all([load(a), load(b)]);
  if (!x || !y) return { title: "Comparison not found | DoesAISeeMyStore" };
  return {
    title: `${x.shop.name} vs ${y.shop.name}: who does AI recommend? | DoesAISeeMyStore`,
    robots: { index: false },
    openGraph: { title: `${x.shop.name} ${x.overall} vs ${y.shop.name} ${y.overall}`, description: "Does AI see your store? Check yours free.", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  };
}

function Side({ r, win }) {
  const colour = r.overall >= 70 ? "var(--good)" : r.overall >= 40 ? "var(--mid)" : "var(--bad)";
  return (
    <div className={`card cmp-side${win ? " win" : ""}`}>
      {win && <span className="badge gold cmp-badge">★ Ahead</span>}
      <h2 className="cmp-name">{r.shop.name}</h2>
      <p className="muted small">{r.shop.domain}</p>
      <div className="ring" style={{ "--v": r.overall, "--c": colour }}>
        <div className="ring-inner">
          <span className="ring-num">{r.overall}</span>
          <span className="ring-of">/100</span>
        </div>
      </div>
      <p className="cmp-label">{r.label}</p>
      <div className="cmp-rows">
        <div>
          <b>
            {r.found} of {r.checked}
          </b>
          <span>searches AI recommended them in</span>
        </div>
        <div>
          <b>{r.topPicks}</b>
          <span>{r.topPicks === 1 ? "search" : "searches"} where they were AI's first pick</span>
        </div>
      </div>
    </div>
  );
}

export default async function Compare({ params }) {
  const { a, b } = await params;
  const [x, y] = await Promise.all([load(a), load(b)]);
  if (!x || !y) notFound();
  const diff = x.overall - y.overall;
  const lead = diff === 0 ? "It's a tie." : `${diff > 0 ? x.shop.name : y.shop.name} is ahead by ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "point" : "points"}.`;

  return (
    <>
      <main className="wrap">
        <header className="top">
          <a href="/" className="logo">
            DoesAI<b>See</b>MyStore
          </a>
          <nav className="topnav" aria-label="Main">
            <a href="/news">News</a>
          </nav>
        </header>
        <div className="page-intro">
          <p className="eyebrow">Head to head · {x.category}</p>
          <h1>Who does AI recommend?</h1>
          <p className="sub">{lead} Same searches, same day, same market.</p>
        </div>
        <div className="cmp">
          <Side r={x} win={diff > 0} />
          <div className="cmp-vs" aria-hidden="true">
            vs
          </div>
          <Side r={y} win={diff < 0} />
        </div>
        <div className="card cta">
          <h3>Want to overtake them?</h3>
          <p className="muted">Your full report shows exactly what to fix, with ready-to-paste text and a step-by-step plan.</p>
          <a className="button" href={`/report/${x.id}`}>
            Back to my report
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
