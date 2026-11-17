"use client";

// The v3 report (agreed 17 November 2026). One question runs through it: can AI see this store, and why or why not?
// Score and 4 mini-scores, At a glance, then 5 sections:
//  1. Does AI recommend you? (the shopper searches: the score comes only from these)
//  2. What AI sees on your website
//  3. What the web says about you
//  4. Who AI recommends instead, and why (short, and only to show what the store can change)
//  5. What to fix
// Free reports arrive from the server with the hidden parts already replaced by filler (shown blurred).
import { useEffect, useState } from "react";
import { isRecent } from "./recent";
import EmailReport from "./EmailReport";
import { H2HCard, H2HBox } from "./HeadToHead";
import { RankBadge, TypeBadge } from "./Badges";
import { Icon, Ic, Fid, Lvl, Section, Unlock, requestEmail, recheckLink, Step, SearchRow, AnswerLines, LEVELS, LEGEND, VERDICT, money, ord, cx, longDate } from "./ReportV2";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@doesaiseemystore.com";
const FREE_REPORTS = process.env.NEXT_PUBLIC_FREE_REPORTS !== "0";
const txt = (x) => (typeof x === "string" ? x : x?.t || "");
const blurred = (x) => typeof x === "object" && x?.blur;

export default function ReportV3({ report, onRecheck, clientView = false, access = "", example = false }) {
  const [copied, setCopied] = useState(false);
  const [mine, setMine] = useState(false);
  const [h2h, setH2h] = useState(report.h2h || null);
  const [allFixes, setAllFixes] = useState(false);
  useEffect(() => setMine(isRecent(report.id) || !report.locked), [report.id, report.locked]);
  useEffect(() => setH2h(report.h2h || null), [report.id, report.h2h]);

  const locked = report.locked;
  const them = report.subject === "them";
  const w = them ? { you: "them", You: "They", your: "their", Your: "Their", are: "are" } : { you: "you", You: "You", your: "your", Your: "Your", are: "are" };
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
  const knows = { 1: "Recommended unprompted", 2: "Shows up sometimes", 3: "Known by name only", 4: "Unknown to AI" }[L.here || 4];
  const filled = { 1: 4, 2: 2, 3: 1, 4: 0 }[L.here || 4];
  const everyday = (report.searches || []).filter((q) => q.group === "everyday");
  const special = (report.searches || []).filter((q) => q.group === "speciality");
  const R = report.replay;
  const web = report.web;
  const site = report.site || { good: [], bad: [] };
  const steps = report.steps || [];
  const instead = report.instead || [];
  const glanceIcons = {
    stand: ["eye", "acc", them ? "Is AI recommending them?" : "Is AI recommending you?"],
    site: ["home", "good", `What AI sees on ${w.your} website`],
    web: ["globe", "vio", "What the web says"],
    instead: ["trophy", "warn", "Who AI picks instead"],
  };

  return (
    <section id="results" className="rv2 results">
      <p className="print-only print-brand">DoesAISeeMyStore · AI visibility report</p>

      {/* Store and score */}
      <div className="rv-hero">
        <div>
          <div className="rv-kick">{them ? "Competitor check" : "AI visibility report"}</div>
          <h2 className="rv-name">{name}</h2>
          <p className="rv-sub">{[report.shop.domain, report.category, report.market].filter(Boolean).join(" · ")}</p>
          {pf.summary && (
            <div className="rv-understood">
              <div className="rv-k">How we understood {w.your} business</div>
              <p>{pf.summary}</p>
              {!example && !them && (
                <a className="no-print" href={recheckLink({ ...report, extra: report.extra || pf.summary })}>Not quite right? Edit it and check again →</a>
              )}
            </div>
          )}
          <div className="rv-meta">
            <span>Real shopper searches</span>
            {report.pagesRead > 1 && <span>{report.pagesRead} pages read</span>}
            {report.productsRead > 0 && <span>{report.productsRead} products read</span>}
            {report.webSearched && <span>Web searched for {w.your} name</span>}
            <span>{longDate(report.createdAt)}</span>
          </div>
          <p className="rv-tested">Tested with a leading AI assistant using live web search. AI answers vary from one ask to the next, so treat this as a snapshot.</p>
        </div>
        <div className="rv-card rv-score" id="r-score">
          <div className="rv-score-row">
            <RankBadge rank={s.rankKey} size={64} />
            <div>
              <div className="rv-big">{s.value}<small> /100</small></div>
              <div className="rv-lab">AI Visibility Score</div>
            </div>
          </div>
          <div className="rv-pills">
            <span className="rv-pill"><RankBadge rank={s.rankKey} size={22} />{s.rank}</span>
            <span className="rv-pill"><TypeBadge type={s.typeKey} size={22} />{s.type}</span>
          </div>
          <div className="rv-bar"><i style={{ width: `${Math.max(3, s.value)}%` }} /></div>
          <div className="rv-bar-l">
            <span>{s.rank}</span>
            <span>{s.next ? `${s.next.points} points to ${s.next.name}` : "Top rank"}</span>
          </div>
          <p className="rv-typetext">
            <b>{s.type}:</b> {them ? String(s.typeText || "").replace(/\byour\b/gi, "their").replace(/\byou\b/gi, "them") : s.typeText}
          </p>
          <p className="rv-scorenote">The score comes only from what AI did when shoppers asked.</p>
          {change && <p className={`rv-change ${change.diff > 0 ? "good" : change.diff < 0 ? "bad" : ""}`}>{change.diff > 0 ? `▲ Up ${change.diff}` : change.diff < 0 ? `▼ Down ${Math.abs(change.diff)}` : "No change"} since {change.date} (was {report.previous.overall})</p>}
        </div>
      </div>

      {/* The 4 mini-scores */}
      <div className="rv-minis">
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="globe" tone="acc" />Everyday searches</div>
          <div className="rv-val">{s.broad}<small> /100</small></div>
          <p>Recommended in {s.broadPct ? `${s.broadPct}%` : "none"}</p>
          <div className="rv-meter"><i style={{ width: `${Math.max(3, s.broad)}%`, background: tone(s.broad) }} /></div>
        </div>
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="bag" tone="good" />{w.Your} speciality</div>
          <div className="rv-val">{s.home}<small> /100</small></div>
          <p>Recommended in {s.nichePct ? `${s.nichePct}%` : "none"}</p>
          <div className="rv-meter"><i style={{ width: `${Math.max(3, s.home)}%`, background: tone(s.home) }} /></div>
        </div>
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="home" tone="warn" />{w.Your} website</div>
          {s.readyOf ? <div className="rv-val">{s.ready}<small> of {s.readyOf} AI-ready</small></div> : <div className="rv-val txt">Couldn't check</div>}
          <p>{s.readyOf - s.ready > 0 ? `${s.readyOf - s.ready} ${s.readyOf - s.ready === 1 ? "thing" : "things"} AI can't see yet` : s.readyOf ? "Everything we checked is AI-ready" : "Your website didn't open for us"}{s.unchecked && s.readyOf ? ` · ${s.unchecked} couldn't check` : ""}</p>
          <div className="rv-meter"><i style={{ width: `${Math.max(3, s.readyOf ? (s.ready / s.readyOf) * 100 : 0)}%`, background: tone(s.readyOf ? (s.ready / s.readyOf) * 100 : 0) }} /></div>
        </div>
        <div className="rv-card rv-mini">
          <div className="rv-mini-h"><Ic name="brain" tone="vio" />AI knows {w.you}</div>
          <div className="rv-val txt">{knows}</div>
          <div className="rv-rungs">{[0, 1, 2, 3].map((i) => <i key={i} className={i < filled ? "on" : ""} />)}</div>
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
              const [ic, t, title] = glanceIcons[g.key] || glanceIcons.stand;
              return (
                <div className="rv-pt" key={g.key}>
                  <div className="rv-pt-h"><Ic name={ic} tone={t} /><b>{title}</b></div>
                  <p className="rv-lead">{g.lead}</p>
                  <p className="rv-d">{locked ? (<>{g.head}<span className="rv-blur">{g.tail}</span></>) : g.para}</p>
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
              <a href="#r-steps">See what to fix ↓</a>
            </div>
          )}
        </section>
      )}

      {/* 1. Does AI recommend you? */}
      <Section n={1} id="r-questions" title={them ? "Does AI recommend them?" : "Does AI recommend you?"} sub={`${locked ? "Some of the questions we asked. " : ""}Real shopper questions, asked with live web search. We never named ${name}. The same questions are reused every time ${them ? "they're" : "you're"} checked, so before and after is a fair test.`} lock={locked}>
        <div className="rv-legend">{[...LEGEND, ...((report.searches || []).some((q) => q.level === "none") ? ["none"] : [])].map((l) => <Lvl key={l} level={l} />)}</div>
        {everyday.length > 0 && <div className="rv-grp">Everyday searches · how most shoppers ask</div>}
        {everyday.map((q, i) => <SearchRow key={`e${i}`} q={q} />)}
        {special.length > 0 && <div className="rv-grp">{w.Your} speciality · the products {w.you} {w.are} known for</div>}
        {special.map((q, i) => <SearchRow key={`s${i}`} q={q} />)}
        {(report.own || []).length > 0 && <div className="rv-grp">{w.Your} own questions</div>}
        {(report.own || []).map((q, i) => <SearchRow key={`o${i}`} q={q} />)}
        {(report.searches || []).some((q) => q.level === "none") && (
          <p className="rv-note">"No shop recommended" means AI didn't name any shop for that question, so nobody could win it. Those searches aren't counted in {w.your} score.</p>
        )}
        {L.push && (
          <p className="rv-note">
            <b>We pushed once.</b> When the shopper asked for smaller or independent shops, AI {L.push.present ? `named ${name}${L.push.position ? ` ${ord(L.push.position)}` : ""}.` : `still didn't name ${name}.`} This doesn't change the score; it shows how close {w.you} {w.are}.
          </p>
        )}
        {locked && <Unlock report={report}>See every search, and who AI picked, in {w.your} full report.</Unlock>}
      </Section>

      {/* 2. What AI sees on your website */}
      <Section n={2} id="r-site" title={`What AI sees on ${w.your} website`} sub={report.siteUnreachable ? `We tried to read ${w.your} website the way an AI assistant would.` : `We read ${report.pagesRead > 1 ? `${report.pagesRead} pages` : "the website"}${report.productsRead ? ` and ${report.productsRead} products` : ""} the way an AI assistant would.`} tag={s.readyOf ? `${s.ready} of ${s.readyOf} AI-ready` : "Couldn't check"}>
        {report.siteUnreachable && (
          <div className="rv-flag"><Ic name="warn" tone="bad" /><span><b>We couldn't open {w.your} website.</b> It may block automated visitors, or it was down when we checked. AI tools may be turned away in the same way, which would stop them reading {w.your} products and policies. Everything else in this report comes from AI's own answers.</span></div>
        )}
        <div className="rv-profile">
          {[[them ? "What they sell" : "What you sell", pf.sells], [them ? "Where they sell" : "Where you sell", pf.where], [them ? "Who they are" : "Who you are", pf.who], ["How big", pf.size], [`${w.Your} values`, pf.values], ["Who buys from " + w.you, pf.buyers]]
            .filter(([, v]) => v && !/^unknown$/i.test(v))
            .map(([k, v]) => (
              <div className="rv-tile" key={k}><div className="rv-k">{k}</div><p>{v}</p></div>
            ))}
        </div>
        {pf.mismatch && !them && (
          <div className="rv-flag"><Ic name="flag" tone="warn" /><span><b>{pf.mismatch}</b> We tested what the website actually shows, because that's what AI sees.</span></div>
        )}
        {(site.good.length > 0 || site.bad.length > 0) && (
          <div className="rv-grid2 rv-mt">
            <div className="rv-tile pad">
              <div className="rv-pt-h"><Ic name="check" tone="good" /><h3>What AI can read</h3></div>
              <ul className="rv-list">{site.good.map((x, i) => <li key={i} className={blurred(x) ? "rv-blur" : ""}>{txt(x)}</li>)}</ul>
            </div>
            <div className="rv-tile pad">
              <div className="rv-pt-h"><Ic name="warn" tone="bad" /><h3>What AI can't see</h3></div>
              <ul className="rv-list">{site.bad.map((x, i) => <li key={i} className={blurred(x) ? "rv-blur" : ""}>{txt(x)}</li>)}</ul>
            </div>
          </div>
        )}
        <h3 className="rv-h3 rv-mt">AI-ready checklist</h3>
        <p className="rv-soft rv-sm">Checked directly on the site, using our AI Shopping Playbook.{s.unchecked ? ` "?" means we couldn't check it (usually our reader's limit, not a fault of ${w.your} site), so it isn't counted.` : ""}</p>
        <div className="rv-ready rv-mt-s">
          {(report.ready || []).map((r, i) => (
            <div className={cx("rv-chk", r.blur && "rv-blur", r.ok === null && "unk")} key={i}>
              <span className={`i ${r.ok === null ? "u" : r.ok ? "y" : "n"}`}>{r.ok === null ? "?" : r.ok ? "✓" : "✕"}</span>
              <div><b>{r.title}<Fid f={r.factor} /></b><span>{r.detail}</span></div>
            </div>
          ))}
        </div>
        {locked && <Unlock report={report}>The rest of the checklist, and what AI can't see, are in {w.your} full report.</Unlock>}
      </Section>

      {/* 3. What the web says */}
      {web && (
        <Section n={3} id="r-web" title={`What the web says about ${w.you}`} sub={`We asked AI about ${name} by name, the way a curious shopper would, and looked at where ${w.you} turn up online.`} lock={locked}>
          <div className={cx("rv-known", web.known ? "good" : "bad")}>
            <Ic name={web.known ? "check" : "warn"} tone={web.known ? "good" : "bad"} />
            <span><b>{web.known ? `AI knows ${name} by name.` : `AI didn't know ${name} by name.`}</b> {web.summary}</span>
          </div>
          <div className="rv-presence">
            {(web.presence || []).map((p) => (
              <div key={p.key} className={cx("rv-pres", p.found ? "y" : "u")}>
                <span className="i">{p.found ? "✓" : "–"}</span>
                <div>
                  <b>{p.label}</b>
                  <span className={p.hostsBlur && p.found ? "rv-blur" : ""}>{p.found ? p.hosts.join(", ") : "Didn't come up in this search"}</span>
                </div>
              </div>
            ))}
          </div>
          {web.rating && <p className={cx("rv-note", web.ratingBlur && "rv-blur")}>Reviews AI quoted: <b>{web.rating}</b></p>}
          {(web.lines || []).length > 0 && (
            <div className="rv-quote">
              <div className="who">We asked: "{web.question}"</div>
              {web.lines.map((l, i) => (
                <p key={i} className={l.blur ? "rv-blur" : ""}>{l.t}{l.tail ? <span className="rv-blur">{l.tail}</span> : null}</p>
              ))}
            </div>
          )}
          {(report.accuracy || []).length > 0 && (
            <>
              <h3 className="rv-h3 rv-mt">Does AI get {w.you} right?</h3>
              <div className="rv-tablewrap">
                <table className="rv-table">
                  <thead><tr><th>Topic</th><th>What AI told the shopper</th><th>{w.Your} website says</th><th /></tr></thead>
                  <tbody>
                    {report.accuracy.map((a, i) => (
                      <tr key={i} className={a.blur ? "rv-blur" : ""}>
                        <td><b>{a.topic}</b></td><td>{a.ai}</td><td>{a.store}</td>
                        <td className={`rv-st ${VERDICT[a.verdict]?.[0] || ""}`}>{VERDICT[a.verdict]?.[1] || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Section>
      )}

      {/* 4. Who AI recommends instead */}
      {(instead.length > 0 || R) && (
        <Section n={web ? 4 : 3} id="r-instead" title="Who AI recommends instead, and why" sub={`From the same answers. It's here to show what ${w.you} can change, not to size up the market.`} lock={locked}>
          {instead.length > 0 && (
            <div className="rv-brs rv-instead">
              {instead.map((x, i) => (
                <div className="rv-br2" key={i}>
                  <div className="rv-br">
                    <span>{x.name}{x.marketplace ? <em className="rv-mk">marketplace</em> : null}</span>
                    <div className="rv-track"><i style={{ width: `${Math.max(3, x.pct)}%` }} /></div>
                    <span className="v">{x.pct}%</span>
                  </div>
                  {x.why ? <p className={cx("rv-why1", x.whyBlur && "rv-blur")}>{x.why}<Fid f={x.factor} /></p> : null}
                </div>
              ))}
            </div>
          )}
          {R && (
            <>
              <h3 className="rv-h3 rv-mt">Replay: what a shopper saw</h3>
              <div className="rv-grid2 rv-rep">
                <div className="rv-chat">
                  <div className="rv-bq">{R.question}</div>
                  <div className="rv-ba">
                    <AnswerLines lines={R.lines || []} />
                    {(R.hosts || []).length > 0 && <div className={cx("rv-srcs", R.metaBlur && "rv-blur")}>{R.hosts.map((h, i) => <span key={i}>{h}</span>)}</div>}
                  </div>
                  <div className="rv-alert">
                    <Ic name="eye" tone="vio" />
                    <span>
                      {R.level === "fnc" ? <b>AI looked at {w.your} website, then chose others.</b> : ["men", "rec"].includes(R.level) ? <b>{R.position ? `${name} came ${ord(R.position)}.` : `${name} was only mentioned in passing.`}</b> : <b>{name} wasn't mentioned.</b>}{" "}
                      {R.match?.title ? `${w.You} sell ${R.match.title}${money(cur, R.match.price) ? ` (${money(cur, R.match.price)})` : ""}, which fits this search.` : ""}
                    </span>
                  </div>
                </div>
                {(R.why || []).length > 0 && (
                  <div>
                    <h3 className="rv-h3">Why AI chose them, not {them ? name : "you"}</h3>
                    <div className="rv-why">
                      {R.why.map((x, i) => (
                        <div key={i} className={x.blur ? "rv-blur" : ""}>
                          <span className="n">{i + 1}</span>
                          <span><b>{x.title}<Fid f={x.factor} /></b>{x.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Section>
      )}

      {/* 5. What to fix */}
      {steps.length > 0 && (
        <Section n={web ? 5 : 4} id="r-steps" title={them ? "How to beat them: what to fix" : "What to fix"} sub="Best first: the most benefit for the least effort. Each one is tied to a factor from our AI Shopping Playbook, and to evidence from this check." lock={locked} tag={report.stepsTime ? `First 3: about ${report.stepsTime}` : ""}>
          {steps.slice(0, 3).map((st, i) => <Step key={i} n={i + 1} s={st} />)}
          {!locked && steps.length > 3 && (
            <div className="no-print">
              {allFixes ? steps.slice(3).map((st, i) => <Step key={i} n={i + 4} s={st} />) : (
                <button type="button" className="rv-more" onClick={() => setAllFixes(true)}>See {steps.length - 3} more {steps.length - 3 === 1 ? "fix" : "fixes"}</button>
              )}
            </div>
          )}
          {(report.snippet || (report.plan || []).length > 0) && (
            <div className={cx("rv-grid2 rv-mt", locked && "rv-blur")}>
              {report.snippet && (
                <div>
                  <h3 className="rv-h3">Ready-to-paste text</h3>
                  <p className="rv-sniphead">{report.snippet.title}</p>
                  <pre className="rv-pre">{report.snippet.text}</pre>
                </div>
              )}
              {(report.plan || []).length > 0 && (
                <div>
                  <h3 className="rv-h3">{w.Your} plan</h3>
                  {report.plan.map((p, i) => (
                    <div className="rv-ph" key={i}>
                      <div className="when">{p.stage}</div>
                      <ul>{p.actions.map((a, j) => <li key={j}>{a}</li>)}</ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {locked && <Unlock report={report}>Every fix, ready-to-paste text and {w.your} plan are in {w.your} full report.</Unlock>}
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
            <h3>{FREE_REPORTS ? "See the full picture, free during our beta" : "Unlock the full report"}</h3>
            <p>Every search, everything AI can't see on {w.your} site, what the web says about {w.you}, and {w.your} step-by-step fixes. Opens your email app with a message ready to send.</p>
          </div>
          <a className="rv-btn" href={requestEmail(report)}>{FREE_REPORTS ? "Get the full report →" : "Enquire now →"}</a>
        </div>
      )}
      {locked && !example ? <EmailReport reportId={report.id} /> : null}
      <p className="rv-foot">This is a snapshot, not a guarantee: AI answers change over time.{!example ? ` DoesAISeeMyStore · ${CONTACT}` : ""}</p>
    </section>
  );
}

function tone(v) {
  return v >= 55 ? "var(--good)" : v >= 35 ? "var(--warn)" : "var(--bad)";
}
