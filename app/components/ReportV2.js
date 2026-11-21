"use client";

// The v2 report (agreed November 2026): score, 4 mini-scores, At a glance, then 11 sections.
// Free reports arrive from the server with the hidden parts already replaced by filler (shown blurred).
import { useEffect, useState } from "react";
import { isRecent } from "./recent";
import EmailReport from "./EmailReport";
import { H2HCard, H2HBox } from "./HeadToHead";
import { RankBadge, TypeBadge } from "./Badges";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@doesaiseemystore.com";
const FREE_REPORTS = process.env.NEXT_PUBLIC_FREE_REPORTS !== "0";

const LEVELS = {
  top: ["l-top", "Top pick"],
  rec: ["l-rec", "Recommended"],
  men: ["l-men", "Mentioned"],
  mkt: ["l-men", "Via a marketplace"],
  fnc: ["l-fnc", "Found, not chosen"],
  nf: ["l-nf", "Not found"],
  warned: ["l-nf", "Warned against"],
  hidden: ["l-men", "Hidden"],
  none: ["l-none", "No shop recommended"],
};
const LEGEND = ["top", "rec", "men", "fnc", "nf"];
const VERDICT = { right: ["good", "✓ Right"], partly: ["warn", "≈ Partly"], wrong: ["bad", "✕ Wrong"], missing: ["bad", "✕ Missing"] };
const ord = (n) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;
const longDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const cx = (...a) => a.filter(Boolean).join(" ");
const COLORS = ["#6b8cff", "#a78bfa", "#4fc3f7", "#8b93ad", "#4a5168"];

function money(cur, p) {
  if (!p) return "";
  if (/[£$€]/.test(p)) return p;
  const n = Number(String(p).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${cur || ""}${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.00$/, "")}`;
}

// Small line icons.
const P = {
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  brain: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5 3 3 0 0 0 5 1V5a3 3 0 0 0-3-1Z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5 3 3 0 0 1-5 1" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  pin: <><circle cx="12" cy="10" r="3" /><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" /></>,
  warn: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  arrow: <path d="M7 17 17 7M8 7h9v9" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  bag: <><path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
};
function Icon({ name, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
const Ic = ({ name, tone }) => (
  <span className={`rv-ic g-${tone}`}>
    <Icon name={name} />
  </span>
);
const Fid = ({ f }) => (f && f !== "F0" ? <span className="rv-fid" title="AI Shopping Playbook factor">{f}</span> : f === "F0" ? <span className="rv-fid">F0</span> : null);
const Lvl = ({ level }) => {
  const [c, l] = LEVELS[level] || LEVELS.hidden;
  return (
    <span className={`rv-lvl ${c}`}>
      <i />
      {l}
    </span>
  );
};

function Section({ n, title, sub, tag, lock, id, children }) {
  return (
    <section className="rv-card rv-sec" id={id}>
      <div className="rv-sec-h">
        <div className="rv-sec-t">
          <span className="rv-no">{n}</span>
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
        </div>
        {lock ? (
          <span className="rv-locktag">
            <Icon name="lock" size={13} /> More in full report
          </span>
        ) : tag ? (
          <span className="rv-tag">{tag}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function requestEmail(report) {
  const site = typeof window !== "undefined" ? window.location.origin : "https://www.doesaiseemystore.com";
  const link = report.id ? `${site}/report/${report.id}` : site;
  const body = `Hi Team,\n\nI'd love my full report!\n\nLink: ${link}\n\nPlease share a few details about your store so we can conduct further analysis:\n`;
  return `mailto:${CONTACT}?subject=${encodeURIComponent(`Free full report: ${report.shop.domain}`)}&body=${encodeURIComponent(body)}`;
}

function Unlock({ report, children }) {
  return (
    <div className="rv-unlock no-print">
      <span>
        <Icon name="lock" size={13} /> {children}
      </span>
      <a className="rv-btn sm" href={requestEmail(report)}>
        Get the full report
      </a>
    </div>
  );
}

function Donut({ share, youPct, blur }) {
  const rows = [...share.map((s, i) => ({ v: s.pct, c: COLORS[i % COLORS.length] })), { v: youPct, c: "var(--good)" }].filter((r) => r.v > 0);
  const tot = rows.reduce((a, r) => a + r.v, 0) || 1;
  const C = 2 * Math.PI * 80;
  let off = 0;
  return (
    <svg width="150" height="150" viewBox="0 0 220 220" className={blur ? "rv-blur" : ""} aria-hidden="true">
      <circle cx="110" cy="110" r="80" fill="none" stroke="var(--s2)" strokeWidth="26" />
      {rows.map((r, i) => {
        const L = (C * r.v) / tot;
        const el = <circle key={i} cx="110" cy="110" r="80" fill="none" stroke={r.c} strokeWidth="26" strokeDasharray={`${Math.max(0, L - 3)} ${C - L + 3}`} strokeDashoffset={-off} transform="rotate(-90 110 110)" />;
        off += L;
        return el;
      })}
      <text x="110" y="108" textAnchor="middle" fontSize="38" fontWeight="650" fill="var(--tx)">
        {youPct}%
      </text>
      <text x="110" y="132" textAnchor="middle" fontSize="13" fill="var(--mut)">
        your share
      </text>
    </svg>
  );
}

function recheckLink(report) {
  const q = new URLSearchParams({ website: report.shop.domain, sell: report.category || "", recheck: "1" });
  if (report.location) q.set("loc", report.location);
  if (report.extra) q.set("extra", report.extra);
  if (report.subject === "them") q.set("mode", "rival");
  for (const c of report.customs || []) q.append("q", c);
  return `/?${q.toString()}`;
}

export default function ReportV2({ report, onRecheck, clientView = false, access = "", example = false }) {
  const [copied, setCopied] = useState(false);
  const [mine, setMine] = useState(false);
  const [h2h, setH2h] = useState(report.h2h || null);
  const [allFixes, setAllFixes] = useState(false);
  useEffect(() => setMine(isRecent(report.id) || !report.locked), [report.id, report.locked]);
  useEffect(() => setH2h(report.h2h || null), [report.id, report.h2h]);

  const locked = report.locked;
  const them = report.subject === "them";
  const w = them ? { you: "them", You: "They", your: "their", Your: "Their", youre: "they're" } : { you: "you", You: "You", your: "your", Your: "Your", youre: "you're" };
  const s = report.score || {};
  const pf = report.profile || {};
  const name = report.shop.name;
  const cur = { GB: "£", US: "$", CA: "$", AU: "$", NZ: "$", IE: "€", FR: "€", DE: "€", ES: "€", IT: "€", NL: "€" }[report.marketCountry] || (/(uk|united kingdom|england|scotland|wales)/i.test(report.market || "") ? "£" : "");
  const canRecheck = !example && (Boolean(onRecheck) || mine);
  const link = typeof window !== "undefined" ? `${window.location.origin}/report/${report.id}` : `/report/${report.id}`;
  const change = report.previous ? { diff: report.overall - report.previous.overall, date: new Date(report.previous.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) } : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const L = report.ladder || {};
  const knows = { 1: "Recommended unprompted", 2: "Shows up when pushed", 3: "Known by name only", 4: "Unknown to AI" }[L.here || 4];
  const filled = { 1: 4, 2: 2, 3: 1, 4: 0 }[L.here || 4];
  const broad = (report.searches || []).filter((q) => q.group === "broad");
  const personal = (report.searches || []).filter((q) => q.group === "personal");
  const R = report.replay;
  const M = report.marketView || {};
  const Wn = report.winners;
  const steps = report.steps || [];
  const pf0 = report.profile || {};
  const isLocal = ["local", "regional"].includes(pf0.reach);
  const peers = report.peers || [];
  const glanceIcons = { stand: ["pin", "acc", "Where you stand"], working: ["check", "good", "What's working"], holding: ["warn", "warn", `What's holding ${w.you} back`], winning: ["trophy", "bad", "Who's winning, and why"] };
  if (them) glanceIcons.stand[2] = "Where they stand";

  return (
    <section id="results" className="rv2 results">
      <p className="print-only print-brand">DoesAISeeMyStore · AI visibility report</p>

      {/* Store and score */}
      <div className="rv-hero">
        <div>
          <div className="rv-kick">{them ? "Competitor check" : "AI visibility report"}</div>
          <h2 className="rv-name">{name}</h2>
          <p className="rv-sub">
            {[report.shop.domain, report.category, report.market].filter(Boolean).join(" · ")}
          </p>
          <div className="rv-meta">
            <span>Real shopper searches</span>
            {report.followUps > 0 && <span>{report.followUps} follow-up tests</span>}
            {peers.length > 0 ? <span>{peers.length} direct competitors found</span> : report.rivalsStudied > 0 && <span>{report.rivalsStudied} rival studied</span>}
            {report.pagesRead > 1 && <span>{report.pagesRead} pages read</span>}
            <span>{longDate(report.createdAt)}</span>
          </div>
          <p className="rv-tested">Tested with leading AI assistants using live web search. AI answers vary over time, so treat this as a snapshot.</p>
        </div>
        <div className="rv-card rv-score" id="r-score">
          <div className="rv-score-row">
            <RankBadge rank={s.rankKey} size={64} />
            <div>
              <div className="rv-big">
                {s.value}
                <small> /100</small>
              </div>
              <div className="rv-lab">AI Visibility Score</div>
            </div>
          </div>
          <div className="rv-pills">
            <span className="rv-pill">
              <RankBadge rank={s.rankKey} size={22} />
              {s.rank}
            </span>
            <span className="rv-pill">
              <TypeBadge type={s.typeKey} size={22} />
              {s.type}
            </span>
          </div>
          <div className="rv-bar">
            <i style={{ width: `${Math.max(3, s.value)}%` }} />
          </div>
          <div className="rv-bar-l">
            <span>{s.rank}</span>
            <span>{s.next ? `${s.next.points} points to ${s.next.name}` : "Top rank"}</span>
          </div>
          <p className="rv-typetext">
            <b>{s.type}:</b> {them ? String(s.typeText || "").replace(/\byour\b/gi, "their").replace(/\byou\b/gi, "them") : s.typeText}
          </p>
          {change && <p className={`rv-change ${change.diff > 0 ? "good" : change.diff < 0 ? "bad" : ""}`}>{change.diff > 0 ? `▲ Up ${change.diff}` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)}` : "No change"} since {change.date} (was {report.previous.overall})</p>}
        </div>
      </div>

      {/* The 4 mini-scores */}
      <div className="rv-minis">
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="globe" tone="bad" />{isLocal ? "Local reach" : "Broad reach"}</div>
          <div className="rv-val">{s.broad}<small> /100</small></div>
          <p>{isLocal ? "Everyday local searches" : "Everyday searches"}: picked in {s.broadPct ? `${s.broadPct}%` : "none"}</p>
          <div className="rv-meter"><i style={{ width: `${Math.max(3, s.broad)}%`, background: s.broad >= 55 ? "var(--good)" : s.broad >= 35 ? "var(--warn)" : "var(--bad)" }} /></div>
        </div>
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="home" tone="good" />Home turf</div>
          <div className="rv-val">{s.home}<small> /100</small></div>
          <p>{w.Your} niche: recommended in {s.nichePct ?? 0}%</p>
          <div className="rv-meter"><i style={{ width: `${Math.max(3, s.home)}%`, background: s.home >= 55 ? "var(--good)" : s.home >= 35 ? "var(--warn)" : "var(--bad)" }} /></div>
        </div>
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="brain" tone="acc" />AI knows {w.you}</div>
          <div className="rv-val txt">{knows}</div>
          <div className="rv-rungs">{[0, 1, 2, 3].map((i) => <i key={i} className={i < filled ? "on" : ""} />)}</div>
        </div>
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="check" tone="warn" />AI gets {w.you} right</div>
          {s.rightOf ? (
            <>
              <div className="rv-val">{s.right}<small> of {s.rightOf} facts</small></div>
              <p>{s.wrongTopics?.length ? `${s.wrongTopics.slice(0, 2).join(" and ")} ${s.wrongTopics.length > 1 ? "are" : "is"} wrong` : "Everything we checked is right"}</p>
              <div className="rv-meter"><i style={{ width: `${Math.max(3, (s.right / s.rightOf) * 100)}%`, background: "var(--warn)" }} /></div>
            </>
          ) : (
            <><div className="rv-val txt">Not enough to check</div><p>AI said too little about {w.you} to compare</p></>
          )}
        </div>
      </div>

      {/* At a glance */}
      {(report.glance || []).length > 0 && (
        <section className="rv-card rv-glance" id="r-glance">
          <div className="rv-glance-h">
            <h2>At a glance</h2>
            <span>What we found, in 30 seconds</span>
          </div>
          <div className="rv-g4">
            {report.glance.map((g) => {
              const [ic, tone, title] = glanceIcons[g.key] || glanceIcons.stand;
              return (
                <div className="rv-pt" key={g.key}>
                  <div className="rv-pt-h"><Ic name={ic} tone={tone} /><b>{title}</b></div>
                  <p className="rv-lead">{g.lead}</p>
                  <p className="rv-d">
                    {locked ? (<>{g.head}<span className="rv-blur">{g.tail}</span></>) : g.para}
                  </p>
                  {g.facts?.length > 0 && (
                    <div className={cx("rv-facts", g.factsBlur && "rv-blur")}>
                      {g.facts.map(([a, b], i) => <span key={i}>{a} <i>{b}</i></span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {report.goodNews && (
            <div className="rv-next">
              <p><b>The good news:</b> {report.goodNews}</p>
              <a href="#r-steps">See {w.your} next steps ↓</a>
            </div>
          )}
        </section>
      )}

      {/* 1. What we learned */}
      <Section n={1} title={`What we learned about ${w.your} store`} sub={`We explored ${report.pagesRead > 1 ? `${report.pagesRead} pages` : "the website"}${report.productsRead ? ` and ${report.productsRead} products` : ""} before asking AI anything.`}>
        <div className="rv-profile">
          {[["What " + (them ? "they sell" : "you sell"), pf.sells], ["Where " + (them ? "they sell" : "you sell"), pf.where], ["Who " + (them ? "they are" : "you are"), pf.who], ["How big", pf.size], [`${w.Your} values`, pf.values], ["Who buys from " + w.you, pf.buyers]]
            .filter(([, v]) => v && !/^unknown$/i.test(v))
            .map(([k, v]) => (
              <div className="rv-tile" key={k}><div className="rv-k">{k}</div><p>{v}</p></div>
            ))}
        </div>
        {pf.mismatch && !them && (
          <div className="rv-flag"><Ic name="flag" tone="warn" /><span><b>{pf.mismatch}</b> That's how we built your personal questions, and it's what AI should know you for.</span></div>
        )}
        {pf.reach && (
          <p className="rv-note">
            <b>{isLocal ? `A local shop${pf.city ? ` in ${pf.city}` : ""}${pf.reach === "regional" ? ", with a real online side" : ""}.` : "An online-first store."}</b>{" "}
            {isLocal ? `So we tested the searches shoppers near ${w.you} make, like a phone in ${pf.city || "your area"} would, and compared ${w.you} with shops of ${w.your} size and kind, not national chains.` : `So we tested the searches shoppers make across ${report.market || "the country"}, and compared ${w.you} with stores of ${w.your} size and kind.`}
          </p>
        )}
        {peers.length > 0 && (
          <>
            <h3 className="rv-h3 rv-mt">{w.Your} direct competitors</h3>
            <p className="rv-soft rv-sm">Shops a customer would genuinely compare with {w.you}: the same kind of shop, a similar size and style{isLocal ? ", nearby" : ""}. We found these before asking AI anything.</p>
            <div className="rv-peers">
              {peers.map((p, i) => (
                <div className="rv-tile" key={i}>
                  <div className="rv-k">{p.where || "Competitor"}</div>
                  <b>{p.name}</b>
                  {p.why ? <p>{p.why}</p> : null}
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* 2. Replay */}
      {R && (
        <Section n={2} id="r-replay" title="Replay: what a shopper saw" sub={`A real answer from one of ${w.your} searches.${R.level === "fnc" ? ` AI found ${w.your} website, then chose others.` : ""}`} lock={locked} tag={LEVELS[R.level]?.[1]}>
          <div className="rv-grid2 rv-rep">
            <div className="rv-chat">
              <div className="rv-bq">{R.question}</div>
              <div className="rv-ba">
                <AnswerLines lines={R.lines || []} />
                {(R.queries || []).length > 0 && (
                  <div className={cx("rv-searched", R.metaBlur && "rv-blur")}>AI searched {R.queries.slice(0, 3).map((q, i) => <code key={i}>{q}</code>)}</div>
                )}
                {(R.hosts || []).length > 0 && (
                  <div className={cx("rv-srcs", R.metaBlur && "rv-blur")}>{R.hosts.map((h, i) => <span key={i}>{h}</span>)}</div>
                )}
              </div>
              <div className="rv-alert">
                <Ic name="eye" tone="vio" />
                <span>
                  {["fnc"].includes(R.level) ? <b>AI looked at {w.your} website, then chose others.</b> : ["men", "rec"].includes(R.level) ? <b>{name} came {R.position ? ord(R.position) : "low in the list"}.</b> : <b>{name} wasn't mentioned.</b>}{" "}
                  {R.match?.title ? `${w.You} sell ${R.match.title}${money(cur, R.match.price) ? ` (${money(cur, R.match.price)})` : ""}, which fits this search.` : ""}
                </span>
              </div>
            </div>
            {(R.why || []).length > 0 && <div>
              <h3 className="rv-h3">Why AI chose them, not {them ? name : "you"}</h3>
              <div className="rv-why">
                {(R.why || []).map((x, i) => (
                  <div key={i} className={x.blur ? "rv-blur" : ""}>
                    <span className="n">{i + 1}</span>
                    <span><b>{x.title}<Fid f={x.factor} /></b>{x.detail}</span>
                  </div>
                ))}
              </div>
            </div>}
          </div>
        </Section>
      )}

      {/* 3. Next steps */}
      {steps.length > 0 && (
        <Section n={3} id="r-steps" title={them ? "How to beat them: next 3 steps" : "Your next 3 steps"} sub="Each one is tied to a factor from our AI Shopping Playbook, and to evidence from this check." lock={locked} tag={report.stepsTime ? `About ${report.stepsTime}` : ""}>
          {steps.slice(0, 3).map((st, i) => <Step key={i} n={i + 1} s={st} />)}
          {!locked && steps.length > 3 && (
            <div className="no-print">
              {allFixes ? steps.slice(3).map((st, i) => <Step key={i} n={i + 4} s={st} />) : (
                <button type="button" className="rv-more" onClick={() => setAllFixes(true)}>See {steps.length - 3} more {steps.length - 3 === 1 ? "fix" : "fixes"}</button>
              )}
            </div>
          )}
          {locked && <Unlock report={report}>Steps 2 and 3, plus every other fix, are in {w.your} full report.</Unlock>}
        </Section>
      )}

      {/* 4. Every search */}
      <Section n={4} id="r-questions" title="Every search we ran" sub={`${locked ? "Some of the searches we ran. " : ""}The same questions are reused every time ${them ? "they're" : "you"} check${them ? "ed" : ""} again, so before and after is a fair test.`} lock={locked}>
        <div className="rv-legend">{LEGEND.map((l) => <Lvl key={l} level={l} />)}</div>
        {broad.length > 0 && <div className="rv-grp">{isLocal ? `Everyday local searches · how shoppers near ${w.you} ask` : "Everyday searches · how most shoppers ask"}</div>}
        {broad.map((q, i) => <SearchRow key={`b${i}`} q={q} />)}
        {personal.length > 0 && <div className="rv-grp">{w.Your} niche · built from what we learned about {w.you}</div>}
        {personal.map((q, i) => <SearchRow key={`p${i}`} q={q} />)}
        {(report.own || []).length > 0 && <div className="rv-grp">{w.Your} own questions</div>}
        {(report.own || []).map((q, i) => <SearchRow key={`o${i}`} q={q} />)}
        {locked && <Unlock report={report}>See every search, and who AI picked, in {w.your} full report.</Unlock>}
      </Section>

      {/* 5. Knowledge ladder */}
      <Section n={5} title={`How well does AI know ${w.you}?`} sub="We ran follow-up tests, like a shopper asking more. They don't change the score; they explain it." lock={locked}>
        <div className="rv-ladder">
          {[
            ["Recommended unprompted", L.here === 1 ? `In ${s.recPct}% of searches` : s.nichePct > 0 && !s.broadPct ? "Only in niche searches" : s.recPct ? `In ${s.recPct}% of searches` : "Not yet"],
            ["Shows up when pushed", L.push ? (L.push.present ? `Asked "any smaller shops?", AI named ${w.you} ${L.push.position ? ord(L.push.position) : ""}`.trim() : `Still not named when pushed`) : s.appearPct ? `Mentioned in ${s.appearPct}% of searches` : "Not tested this time"],
            ["Known by name", L.known ? `✓ AI knows who ${w.you} ${them ? "are" : "are"}` : `AI doesn't know ${w.you} by name yet`],
            ["Unknown to AI", L.here === 4 ? `This is ${w.you}, for now` : `✓ Not ${w.you}`],
          ].map(([t, p], i) => (
            <div key={i} className={cx("rv-rung", L.here === i + 1 && "here", locked && L.othersBlur && L.here !== i + 1 && "rv-blur")}>
              <div className="n">Rung {i + 1}</div>
              <b>{t}</b>
              <p>{p}</p>
            </div>
          ))}
        </div>
        {L.quote && (
          <div className="rv-quote">
            <div className="who">We asked: "{L.quoteQ || `What about ${name}?`}"</div>"{L.quote}
            {L.quoteTail ? <span className="rv-blur">{L.quoteTail}</span> : null}"
          </div>
        )}
        {L.narrow && !locked && (
          <p className="rv-note">
            We also asked a narrower "{L.narrow.from}" question: <i>"{L.narrow.question}"</i>. Result: <Lvl level={L.narrow.level} />
          </p>
        )}
      </Section>

      {/* 6. Why the winners win */}
      <Section n={6} title={Wn?.rival?.peer ? `${w.You} vs ${w.your} closest competitor` : "Why the winners win"} sub={Wn?.rival?.peer ? `We read the website of ${Wn.rival.name}, a shop of ${w.your} size and kind, and compared it with ${w.your}s using what AI looks for.` : `We read the website of the store AI picks most, and compared it with ${w.your}s using AI's own reasons.`} lock={locked}>
        {Wn && Wn.rows?.length ? (
          <>
            <div className="rv-tablewrap">
              <table className="rv-table">
                <thead><tr><th>What AI looks for</th><th>{Wn.rival.name}{Wn.rival.peer ? (Wn.rival.pct ? ` · picked in ${Wn.rival.pct}%` : "") : " · AI's top pick"}</th><th>{name}</th></tr></thead>
                <tbody>
                  {Wn.rows.map((r, i) => (
                    <tr key={i} className={r.blur ? "rv-blur" : ""}>
                      <td><b>{r.label}</b><Fid f={r.factor} /></td>
                      <td className={r.themOk ? "yes" : "nope"}>{r.themOk ? "✓ " : "✕ "}{r.them}</td>
                      <td className={r.youOk ? "yes" : "nope"}>{r.youOk ? "✓ " : "✕ "}{r.you}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={cx("rv-grid2 rv-mt", Wn.extrasBlur && "rv-blur")}>
              <div className="rv-tile pad"><div className="rv-pt-h"><Ic name="check" tone="good" /><h3>What {w.you} do well</h3></div><p className="rv-soft">{Wn.doWell}</p></div>
              <div className="rv-tile pad"><div className="rv-pt-h"><Ic name="arrow" tone="acc" /><h3>Quick wins {w.you} already have</h3></div><p className="rv-soft">{Wn.quickWins}</p></div>
            </div>
          </>
        ) : (
          <p className="rv-soft">We couldn't compare a single rival this time. The fixes above still apply.</p>
        )}
      </Section>

      {/* 7. Market */}
      <Section n={7} title="The market, through AI's eyes" sub="What AI's answers tell us about the whole market, not just this store." lock={locked} tag={M.type}>
        {(M.peers || []).length > 0 && (
          <div className="rv-mb">
            <h3 className="rv-h3">{w.You} vs {w.your} direct competitors</h3>
            <p className="rv-soft rv-sm">How often AI recommended each one in the same searches.{M.bigPct ? ` Big national names appeared in ${M.bigPct}% of answers; they're shown below for context, not as ${w.your} benchmark.` : ""}</p>
            <div className="rv-brs">
              {[{ name: `${name} (${them ? "them" : "you"})`, pct: M.youPct || 0, you: true }, ...M.peers].sort((a, b) => b.pct - a.pct).map((x, i) => (
                <div className={cx("rv-br", x.blur && "rv-blur")} key={i}>
                  <span>{x.you ? <b>{x.name}</b> : x.name}</span>
                  <div className="rv-track"><i className={x.you ? "me" : ""} style={{ width: `${Math.max(3, x.pct)}%` }} /></div>
                  <span className="v">{x.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rv-grid2">
          <div>
            <div className="rv-donut">
              <Donut share={M.share || []} youPct={M.youPct || 0} blur={locked} />
              <div className="rv-lg">
                {(M.share || []).map((x, i) => (
                  <div key={i} className={x.blur ? "rv-blur" : ""}><i style={{ background: COLORS[i % COLORS.length] }} />{x.name}<span className="v">{x.pct}%</span></div>
                ))}
                <div className={M.youBlur ? "rv-blur" : ""}><i style={{ background: "var(--good)" }} /><b>{name} ({them ? "them" : "you"})</b><span className="v">{M.youPct}%</span></div>
              </div>
            </div>
            {M.note && <p className={cx("rv-note", M.noteBlur && "rv-blur")}><b>{M.type}:</b> {M.note}</p>}
          </div>
          <div>
            <h3 className="rv-h3">What AI rewards here</h3>
            <div className="rv-chips">{(M.rewards || []).map((r, i) => <span key={i} className={cx("rv-chipx", r.blur && "rv-blur")}>{r.reason}{r.count ? <b>×{r.count}</b> : null}</span>)}</div>
            <h3 className="rv-h3 rv-mt">Where AI gets its answers</h3>
            <div className="rv-brs">
              {(M.sources || []).map((x, i) => (
                <div className={cx("rv-br", x.blur && "rv-blur")} key={i}>
                  <span>{x.you ? `${x.host} (${them ? "their" : "your"} site)` : x.host}</span>
                  <div className="rv-track"><i className={x.you ? "me" : ""} style={{ width: `${Math.max(3, x.pct)}%` }} /></div>
                  <span className="v">{x.pct}%</span>
                </div>
              ))}
            </div>
            {(M.priceRange || M.stale > 0) && (
              <p className={cx("rv-note", M.noteBlur && "rv-blur")}>
                {M.priceRange ? <>AI typically recommended products at <b>{M.priceRange}</b>. </> : null}
                {M.stale > 0 ? `${M.stale} of its sources were over 2 years old, so fresh content could win.` : ""}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* 8 + 9 */}
      <div className="rv-stack">
        <Section n={8} title={`What AI says about ${w.you}`} sub="From real answers and the name check, against the store's own pages." lock={locked}>
          {(report.accuracy || []).length ? (
            <table className="rv-table">
              <thead><tr><th>Topic</th><th>What AI told shoppers</th><th>{w.Your} store</th><th /></tr></thead>
              <tbody>
                {report.accuracy.map((a, i) => (
                  <tr key={i} className={a.blur ? "rv-blur" : ""}>
                    <td><b>{a.topic}</b></td><td>{a.ai}</td><td>{a.store}</td>
                    <td className={`rv-st ${VERDICT[a.verdict]?.[0] || ""}`}>{VERDICT[a.verdict]?.[1] || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rv-soft">AI said too little about {w.you} by name to check its facts. That usually means AI doesn't know much about {w.you} yet.</p>
          )}
        </Section>
        <Section n={9} title="AI-ready checklist" sub="Checked directly on the site, using our AI Shopping Playbook." lock={locked} tag={`${s.ready} of ${s.readyOf}`}>
          <div className="rv-ready">
            {(report.ready || []).map((r, i) => (
              <div className={cx("rv-chk", r.blur && "rv-blur")} key={i}>
                <span className={`i ${r.ok ? "y" : "n"}`}>{r.ok ? "✓" : "✕"}</span>
                <div><b>{r.title}<Fid f={r.factor} /></b><span>{r.detail}</span></div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* 10. Products */}
      {(report.products || []).length > 0 && (
        <Section n={10} title={`${w.Your} products, through AI's eyes`} sub={`Which of ${w.your} products AI named in its answers.`} lock={locked}>
          <div className="rv-prods">
            {report.products.map((p, i) => (
              <div className="rv-prod" key={i}>
                <div className={p.blur ? "rv-blur" : ""}>
                  <div className="img"><Icon name="bag" size={28} /></div>
                  <b>{p.title}</b>
                  <span className="p">{money(cur, p.price)}</span>
                  <br />
                  <span className={`rv-st2 ${p.mentions > 0 ? "y" : "n"}`}>{p.mentions > 1 ? `Mentioned in ${p.mentions} answers` : p.mentions === 1 ? "Mentioned once" : "Never mentioned"}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 11. Ready-to-paste and plan */}
      {(report.snippet || (report.plan || []).length > 0) && (
        <Section n={11} title="Ready-to-paste text and the plan" sub="Written for this store. Copy, paste, done." lock={locked}>
          <div className={cx("rv-grid2", locked && "rv-blur")}>
            {report.snippet && (
              <div>
                <p className="rv-sniphead">{report.snippet.title}</p>
                <pre className="rv-pre">{report.snippet.text}</pre>
              </div>
            )}
            <div>
              {(report.plan || []).map((p, i) => (
                <div className="rv-ph" key={i}>
                  <div className="when">{p.stage}</div>
                  <ul>{p.actions.map((a, j) => <li key={j}>{a}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Actions */}
      {!example && canRecheck && (
        <div className="rv-card rv-actions no-print">
          <p>{change ? "Keep improving and check again to track progress." : them ? "Check them again any time to see what's changed." : "Made changes? Check again: same questions, a fair before and after."}</p>
          {onRecheck ? <button type="button" className="rv-btn" onClick={onRecheck}>↻ Check again</button> : <a className="rv-btn" href={recheckLink(report)}>↻ Check again</a>}
        </div>
      )}
      {!example && !locked && clientView && (
        <div className="rv-card rv-actions no-print">
          <p><b>Your full report.</b> Keep this link private. You can save it as a PDF.</p>
          <button type="button" className="rv-btn ghost" onClick={() => window.print()}>Download PDF</button>
        </div>
      )}
      {!example && !locked && !clientView && report.id && (
        <div className="rv-card rv-actions no-print">
          <p><b>Full report (owner view).</b> You're seeing everything because you're signed in as the owner.</p>
          <span className="rv-btns">
            <button type="button" className="rv-btn ghost" onClick={copy}>{copied ? "Copied!" : "Copy link"}</button>
            <button type="button" className="rv-btn ghost" onClick={() => window.print()}>Download PDF</button>
          </span>
        </div>
      )}
      {!example && h2h && <H2HCard h={h2h} />}
      {!example && !h2h && <H2HBox report={report} access={access} onResult={setH2h} />}

      {locked && !example && (
        <div className="rv-beta no-print">
          <div>
            <h3>{FREE_REPORTS ? "Get your full report, completely free" : "Unlock the full report"}</h3>
            <p>Every search, every competitor, AI's full opinion of {w.you}, and {w.your} step-by-step plan. Opens your email app with a message ready to send.</p>
          </div>
          <a className="rv-btn" href={requestEmail(report)}>{FREE_REPORTS ? "Get the full report →" : "Enquire now →"}</a>
        </div>
      )}
      {locked && !example ? <EmailReport reportId={report.id} /> : null}
      <p className="rv-foot">
        This is a snapshot, not a guarantee: AI answers change over time.{!example ? ` DoesAISeeMyStore · ${CONTACT}` : ""}
      </p>
    </section>
  );
}

function Step({ n, s }) {
  return (
    <div className={cx("rv-step", s.blur && "rv-blur")}>
      <div className="k2">{n}</div>
      <div>
        <h3>{s.title}<Fid f={s.factor} /></h3>
        {s.do?.length ? (
          <>
            {/* Newer reports: Do this, then Why, then how you'll know it's working. */}
            <div className="rv-do">
              <span className="rv-do-k">Do this</span>
              {s.do.length > 1 ? <ol>{s.do.map((x, i) => <li key={i}>{x}</li>)}</ol> : <p>{s.do[0]}</p>}
            </div>
            {s.evidence && (
              <div className="rv-why">
                <span className="rv-do-k">Why</span>
                <p className="ev">{s.evidence}</p>
              </div>
            )}
            {s.works && (
              <div className="rv-works">
                <span className="rv-do-k">How you&apos;ll know it&apos;s working</span>
                <p className="ev">{s.works}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="ev">{s.evidence}</p>
            {s.how && <div className="how">{s.how}</div>}
            {s.impact && <div className="imp"><Icon name="arrow" size={13} /> {s.impact}</div>}
          </>
        )}
      </div>
      <div className="eff">
        <div className="tm">{s.effort}</div>
        <div className={`lv ${s.level === "Quick" ? "good" : "warn"}`}>{s.level}</div>
      </div>
    </div>
  );
}

function SearchRow({ q }) {
  return (
    <div className={cx("rv-qq", q.homeTurf && "home", q.blur && "rv-blur")}>
      <div><Lvl level={q.level} /></div>
      <div>
        <div className="t">{q.question}{q.homeTurf ? <span className="rv-ht">Home turf</span> : null}</div>
        <div className="v">{[q.slot, q.verdict].filter(Boolean).join(" · ")}</div>
      </div>
      <div className="r">{q.picks?.length ? `AI picked: ${q.picks.join(", ")}` : ""}</div>
    </div>
  );
}

function AnswerLines({ lines }) {
  const out = [];
  let list = null;
  lines.forEach((l, i) => {
    const m = l.t.match(/^(?:\d+[.)]|[-•*])\s+(.*)$/);
    if (m) {
      if (!list) {
        list = [];
        out.push(<ol key={`o${i}`}>{list}</ol>);
      }
      list.push(<li key={i} className={l.blur ? "rv-blur" : ""}>{m[1]}</li>);
    } else {
      list = null;
      out.push(<p key={i} className={l.blur ? "rv-blur" : ""}>{l.t}</p>);
    }
  });
  return <div className="rv-answer">{out}</div>;
}

// Shared with the v3 report.
export { Icon, Ic, Fid, Lvl, Section, Unlock, requestEmail, recheckLink, Step, SearchRow, AnswerLines, LEVELS, LEGEND, VERDICT, money, ord, cx, longDate };
