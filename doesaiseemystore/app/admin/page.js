import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { OWNER_COOKIE, isOwner } from "../../lib/limits";
import { loadStats } from "../../lib/stats";
import { hasDatabase } from "../../lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats | DoesAISeeMyStore", robots: { index: false, follow: false } };

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function topCounts(items, keyFn, n = 8) {
  const counts = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function Admin({ searchParams }) {
  const jar = await cookies();
  if (!isOwner(jar.get(OWNER_COOKIE)?.value)) notFound();

  const params = await searchParams;
  const showMine = params?.mine === "1";
  const { dates, totals, daily, log } = await loadStats(14);

  const visitorLog = log.filter((e) => showMine || !e.owner);
  const realScans = visitorLog.filter((e) => !e.error && !e.cached);
  const avgScore = realScans.length
    ? Math.round(realScans.reduce((a, e) => a + (e.overall || 0), 0) / realScans.length)
    : null;
  const topCategories = topCounts(visitorLog, (e) => (e.category || "").toLowerCase().trim());
  const topStores = topCounts(visitorLog, (e) => (e.error ? null : e.domain));

  const scansDaily = daily.scans.map((v, i) => v + (showMine ? daily.ownerScans[i] : 0));
  const max = Math.max(1, ...scansDaily);
  const today = scansDaily[scansDaily.length - 1];
  const week = sum(scansDaily.slice(-7));

  const tiles = [
    { label: "Visitor scans, all time", value: totals.scans },
    { label: "Scans today", value: today },
    { label: "Last 7 days", value: week },
    { label: "Average score", value: avgScore ?? "–" },
    { label: "Reused results (free)", value: totals.cached },
    { label: "Hit the daily limit", value: totals.limited },
    { label: "Failed scans", value: totals.errors },
    { label: "Your own scans", value: totals.ownerScans },
  ];

  return (
    <main className="wrap admin">
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
        <span className="tag">Owner stats · only you can see this</span>
      </header>

      {!hasDatabase && (
        <div className="card">
          <b>Database not connected.</b>
          <p className="muted">Stats reset whenever the site restarts until Upstash is connected in Vercel.</p>
        </div>
      )}

      <div className="admin-head">
        <h2>Overview</h2>
        <a className="toggle" href={showMine ? "/admin" : "/admin?mine=1"}>
          {showMine ? "Hide my own scans" : "Include my own scans"}
        </a>
      </div>

      <div className="tiles">
        {tiles.map((t) => (
          <div className="card tile" key={t.label}>
            <span className="tile-num">{t.value}</span>
            <span className="muted">{t.label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Scans per day (last 14 days)</h3>
        <div className="bars" role="img" aria-label={`Scans per day: ${scansDaily.join(", ")}`}>
          {scansDaily.map((v, i) => (
            <div className="bar-col" key={dates[i]}>
              <span className="bar-val">{v || ""}</span>
              <div className="bar" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
              <span className="bar-label">{dates[i].slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="muted small">For visitor numbers (not just scans), open the Analytics tab in Vercel.</p>
      </div>

      <div className="grid">
        <div className="card">
          <h3>What people sell</h3>
          {topCategories.length ? (
            <ol className="comp">
              {topCategories.map(([k, n]) => (
                <li key={k}>
                  <span>{k}</span>
                  <span className="count">{n}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No scans yet.</p>
          )}
        </div>
        <div className="card">
          <h3>Most-checked stores</h3>
          {topStores.length ? (
            <ol className="comp">
              {topStores.map(([k, n]) => (
                <li key={k}>
                  <span>{k}</span>
                  <span className="count">{n}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No scans yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Recent scans</h3>
        {visitorLog.length ? (
          <div className="scroll-x">
            <table className="log">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Store</th>
                  <th>Sells</th>
                  <th>Extra info</th>
                  <th>Score</th>
                  <th>Seen</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {visitorLog.slice(0, 100).map((e, i) => (
                  <tr key={i}>
                    <td>{timeAgo(e.at)}</td>
                    <td>{e.id ? <a href={`/report/${e.id}`}>{e.name || e.domain}</a> : e.domain}</td>
                    <td>{e.category}</td>
                    <td>{e.extra || ""}</td>
                    <td>{e.error ? "–" : e.overall}</td>
                    <td>{e.error ? "–" : `${e.visibility}%`}</td>
                    <td className="small">
                      {e.error ? <span className="bad">Failed: {e.error}</span> : e.cached ? "Reused result" : ""}
                      {e.owner ? " (you)" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No scans yet. Once people start checking their stores, they'll appear here.</p>
        )}
      </div>
    </main>
  );
}
