import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { OWNER_COOKIE, isOwner } from "../../lib/limits";
import { loadStats, loadLog, errorType } from "../../lib/stats";
import { hasDatabase, databaseInfo, getList, getCount } from "../../lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats | DoesAISeeMyStore", robots: { index: false, follow: false } };

const VIEWS = [
  { id: "day", label: "Days" },
  { id: "month", label: "Months" },
  { id: "year", label: "Years" },
];

function last(arr) {
  return arr[arr.length - 1] || 0;
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

function when(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function link(params, changes) {
  const q = new URLSearchParams();
  const merged = { view: params.view, mine: params.mine, page: params.page, ...changes };
  for (const [k, v] of Object.entries(merged)) if (v && !(k === "view" && v === "day") && !(k === "page" && v === 1)) q.set(k, v);
  const s = q.toString();
  return `/admin${s ? `?${s}` : ""}`;
}

export default async function Admin({ searchParams }) {
  const jar = await cookies();
  if (!isOwner(jar.get(OWNER_COOKIE)?.value)) notFound();

  const sp = (await searchParams) || {};
  const view = VIEWS.some((v) => v.id === sp.view) ? sp.view : "day";
  const showMine = sp.mine === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const params = { view, mine: showMine ? "1" : "", page };

  const [chart, days, months, years, log, recent, inbox, messageTotal, feedback, subscribers] = await Promise.all([
    loadStats(view),
    loadStats("day"),
    loadStats("month"),
    loadStats("year"),
    loadLog(page, 50),
    getList("stats:log", 0, 499),
    getList("inbox", 0, 49),
    getCount("stats:messages:all"),
    getList("feedback", 0, 49),
    getList("subscribers", 0, 499),
  ]);

  const withMine = (m, i) => m.scans[i] + (showMine ? m.ownerScans[i] : 0);
  const bars = chart.periods.map((_, i) => withMine(chart.series, i));
  const max = Math.max(1, ...bars);

  const recentVisitor = recent.filter((e) => showMine || !e.owner);
  const realScans = recentVisitor.filter((e) => !e.error && !e.cached);
  const avgScore = realScans.length
    ? Math.round(realScans.reduce((a, e) => a + (e.overall || 0), 0) / realScans.length)
    : "–";
  const topCategories = topCounts(recentVisitor, (e) => (e.category || "").toLowerCase().trim());
  const topStores = topCounts(recentVisitor, (e) => (e.error ? null : e.domain));
  const tableRows = log.items.filter((e) => showMine || !e.owner);

  const tiles = [
    { label: "Scans today", value: last(days.series.scans) },
    { label: "Scans this month", value: last(months.series.scans) },
    { label: "Scans this year", value: last(years.series.scans) },
    { label: "Scans, all time", value: chart.totals.scans },
    { label: "Average score (recent)", value: avgScore },
    { label: "In-depth report requests", value: chart.totals.requests },
    { label: "Messages received", value: messageTotal },
    { label: "Reused results (free)", value: chart.totals.cached },
    { label: "Hit the daily limit", value: chart.totals.limited },
    { label: "Failed scans", value: chart.totals.errors },
    { label: "Your own scans", value: chart.totals.ownerScans },
    { label: "Searches logged", value: log.total },
  ];

  // ---- System health (last 7 days, from the scan log) ----
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = recent.filter((e) => new Date(e.at).getTime() > weekAgo);
  const timed = week.filter((e) => !e.error && !e.cached && typeof e.ms === "number");
  const secs = timed.map((e) => e.ms / 1000);
  const avgSecs = secs.length ? Math.round(secs.reduce((a, b) => a + b, 0) / secs.length) : null;
  const under60 = secs.length ? Math.round((secs.filter((x) => x < 60).length / secs.length) * 100) : null;
  const slowest = secs.length ? Math.round(Math.max(...secs)) : null;
  const failures = week.filter((e) => e.error).map((e) => {
    const k = e.errorType ? { type: e.errorType, system: e.system !== false } : errorType(e.error);
    return { ...e, kind: k.type, system: k.system };
  });
  const systemFails = failures.filter((f) => f.system);
  const attempts = week.filter((e) => !e.cached).length;
  const failRate = attempts ? Math.round((systemFails.length / attempts) * 100) : 0;
  const failGroups = topCounts(failures, (f) => f.kind);
  const apiErrors = systemFails.filter((f) => /AI|API/.test(f.kind)).length;
  const lastFail = systemFails[0];
  const status =
    !attempts ? { cls: "idle", text: "No scans in the last 7 days yet" }
    : failRate >= 20 || (avgSecs && avgSecs > 90) ? { cls: "bad", text: "Needs attention" }
    : failRate >= 8 || (avgSecs && avgSecs > 60) ? { cls: "mid", text: "Mostly fine, keep an eye on it" }
    : { cls: "good", text: "All running smoothly" };
  const GBP = Number(process.env.USD_TO_GBP || 0.79);
  const costed = week.filter((e) => typeof e.cost === "number");
  const weekCost = costed.reduce((a, e) => a + e.cost, 0) * GBP;
  const okCosted = costed.filter((e) => !e.error);
  const avgCost = okCosted.length ? (okCosted.reduce((a, e) => a + e.cost, 0) / okCosted.length) * GBP : null;
  const money = (v) => (v === null ? "–" : v < 1 ? `${Math.round(v * 100)}p` : `£${v.toFixed(2)}`);
  const healthTiles = [
    { label: "Average scan time", value: avgSecs !== null ? `${avgSecs}s` : "–" },
    { label: "Scans under 60 seconds", value: under60 !== null ? `${under60}%` : "–" },
    { label: "Slowest scan", value: slowest !== null ? `${slowest}s` : "–" },
    { label: "Failed scans (system)", value: `${systemFails.length}${attempts ? ` · ${failRate}%` : ""}` },
    { label: "AI / API errors", value: apiErrors },
    { label: "Visitor typos & closed sites", value: failures.length - systemFails.length },
    { label: "Average AI cost per check", value: money(avgCost) },
    { label: "AI cost this week (approx.)", value: costed.length ? money(weekCost) : "–" },
  ];

  const viewLabel = view === "year" ? "per year (last 5 years)" : view === "month" ? "per month (last 12 months)" : "per day (last 30 days)";

  return (
    <main className="wrap admin">
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
        <span className="tag">Owner stats · only you can see this</span>
      </header>

      {hasDatabase ? (
        <p className="db-ok">● Database connected</p>
      ) : (
        <div className="card warn">
          <b>Database not connected yet</b>
          <p className="muted">
            Stats and reports are only kept temporarily until a database is connected. In Vercel, open your project's{" "}
            <b>Storage</b> tab, check your database says it's connected to this project (for <b>Production</b>), then
            go to <b>Deployments → ⋯ → Redeploy</b>.
          </p>
          <p className="muted small">
            Database settings the site can see:{" "}
            {databaseInfo.seen.length ? databaseInfo.seen.join(", ") : "none"}
          </p>
        </div>
      )}

      <div className="card health" id="health">
        <div className="chart-head">
          <h3>System health · last 7 days</h3>
          <span className={`status ${status.cls}`}>● {status.text}</span>
        </div>
        <div className="tiles health-tiles">
          {healthTiles.map((t) => (
            <div className="tile" key={t.label}>
              <span className="tile-num">{t.value}</span>
              <span className="muted">{t.label}</span>
            </div>
          ))}
        </div>
        {failGroups.length > 0 ? (
          <>
            <p className="muted small health-sub">Why scans failed:</p>
            <ul className="comp">
              {failGroups.map(([k, n]) => (
                <li key={k}>
                  <span>{k}</span>
                  <span className="count">{n}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted small">No failed scans in the last 7 days.</p>
        )}
        {lastFail && (
          <p className="muted small health-sub">
            Last system error: {when(lastFail.at)} · <span className="bad">{lastFail.error}</span>
          </p>
        )}
        <p className="muted small health-sub">
          Scan times and costs only count scans made after these updates. Costs are estimates; your exact bill is at console.anthropic.com. "Out of API credit" means it's time to top up at console.anthropic.com.
        </p>
      </div>

      <div className="card" id="inbox">
        <h3>
          Inbox <span className="pill">{inbox.length}</span>
        </h3>
        {inbox.length ? (
          <div className="inbox">
            {inbox.map((m, i) => (
              <div className={`msg ${m.type === "report" ? "msg-report" : ""}`} key={i}>
                <div className="msg-head">
                  {m.type === "report" ? <span className="badge">In-depth report request</span> : <span className="badge muted-badge">Message</span>}
                  <b>{m.business || m.name || "No name"}</b>
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(m.type === "report" ? "Your in-depth AI visibility report" : "Re: DoesAISeeMyStore")}`}>
                    {m.email}
                  </a>
                  <span className="muted small">{when(m.at)}</span>
                </div>
                {m.type === "report" && (
                  <p className="msg-meta small">
                    Website: <b>{m.website}</b>
                    {m.reportId && (
                      <>
                        {" · "}
                        <a href={`/report/${m.reportId}`}>Their free report</a>
                      </>
                    )}
                  </p>
                )}
                <p className="msg-body">{m.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No messages yet. Contact messages and in-depth report requests will appear here.</p>
        )}
      </div>

      <div className="card" id="feedback">
        <h3>
          Feedback <span className="pill">{feedback.length}</span>
        </h3>
        {feedback.length ? (
          <div className="inbox">
            {feedback.map((f, i) => (
              <div className="msg" key={i}>
                <div className="msg-head">
                  <span className="badge">{"★".repeat(f.stars || 0)}{"☆".repeat(5 - (f.stars || 0))}</span>
                  <b>{f.name || "Anonymous"}</b>
                  {f.business && <span>{f.business}</span>}
                  <span className="muted small">{when(f.at)}</span>
                  {f.canShare ? <span className="badge green-badge">OK to show publicly</span> : <span className="badge muted-badge">Private</span>}
                </div>
                <p className="msg-body">{f.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No feedback yet. Send people your feedback link: www.doesaiseemystore.com/feedback</p>
        )}
      </div>

      <div className="card" id="subscribers">
        <h3>
          Tips list <span className="pill">{subscribers.length}</span>
        </h3>
        <p className="muted small">People who ticked "send me occasional tips". Only email these people about tips, and remove anyone who asks.</p>
        {subscribers.length > 0 && (
          <ul className="comp">
            {subscribers.slice(0, 100).map((s, i) => (
              <li key={i}>
                <span>
                  {s.email} <span className="muted small">· {s.domain}</span>
                </span>
                <span className="count">{when(s.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-head">
        <h2>Overview</h2>
        <a className="toggle" href={link(params, { mine: showMine ? "" : "1", page: 1 })}>
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
        <div className="chart-head">
          <h3>Scans {viewLabel}</h3>
          <div className="seg" role="group" aria-label="Time period">
            {VIEWS.map((v) => (
              <a key={v.id} href={link(params, { view: v.id, page: 1 })} className={v.id === view ? "on" : ""} aria-current={v.id === view ? "page" : undefined}>
                {v.label}
              </a>
            ))}
          </div>
        </div>
        <div className="bars" role="img" aria-label={`Scans ${viewLabel}: ${bars.join(", ")}`}>
          {bars.map((v, i) => (
            <div className="bar-col" key={chart.periods[i].key} title={`${chart.periods[i].key}: ${v}`}>
              <span className="bar-val">{v || ""}</span>
              <div className="bar" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
              <span className="bar-label">{chart.periods[i].label}</span>
            </div>
          ))}
        </div>
        <p className="muted small">For website visitors (not just scans), open the Analytics tab in Vercel.</p>
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

      <div className="card" id="searches">
        <h3>
          Every website searched <span className="pill">{log.total}</span>
        </h3>
        {tableRows.length ? (
          <div className="scroll-x">
            <table className="log">
              <thead>
                <tr>
                  <th>Date and time</th>
                  <th>Website</th>
                  <th>Sells</th>
                  <th>Extra info</th>
                  <th>Score</th>
                  <th>Seen</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((e, i) => (
                  <tr key={i}>
                    <td className="nowrap">{when(e.at)}</td>
                    <td>{e.id ? <a href={`/report/${e.id}`}>{e.domain}</a> : e.domain}</td>
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
          <p className="muted">No searches on this page.</p>
        )}
        {log.pages > 1 && (
          <nav className="pager" aria-label="Pages">
            {page > 1 ? <a href={`${link(params, { page: page - 1 })}#searches`}>← Newer</a> : <span />}
            <span className="muted small">
              Page {page} of {log.pages}
            </span>
            {page < log.pages ? <a href={`${link(params, { page: page + 1 })}#searches`}>Older →</a> : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}
