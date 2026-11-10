"use client";

import { useMemo, useState } from "react";

// Every shopper question we asked AI: who it picked, where this store came, and how much there is to gain.
const OPP = {
  high: <span className="chip green">High</span>,
  med: <span className="chip amber">Medium</span>,
  hold: <span className="chip grey">Holding</span>,
};
const RANK = { high: 0, med: 1, hold: 2 };

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Place({ q }) {
  if (q.position === 1) return <span className="chip gold">★ 1st</span>;
  if (q.position) return <span className="chip green">{ordinal(q.position)}</span>;
  if (q.found) return <span className="chip green">✓</span>;
  return <span className="chip red">Missed</span>;
}

function Picks({ q, self }) {
  if (!q.picks) return <span className="muted">–</span>;
  if (!q.picks.length) return <span className="muted">No stores named</span>;
  return q.picks.map((p, i) => (
    <span key={i}>
      {i > 0 && ", "}
      {p === "@self" ? <b>{self}</b> : p}
    </span>
  ));
}

function Rows({ list, self }) {
  return list.map((q, i) => (
    <tr key={i}>
      <td className="q">
        {q.question}
        {q.mine && (
          <>
            {" "}
            <span className="chip blue">Your question</span>
          </>
        )}
      </td>
      <td>{q.mine ? "Yours" : q.category || "–"}</td>
      <td>
        <Place q={q} />
      </td>
      <td className="who">
        <Picks q={q} self={self} />
      </td>
      <td>{OPP[q.opp] || OPP.med}</td>
    </tr>
  ));
}

export default function QuestionExplorer({ report }) {
  const them = report.subject === "them";
  const self = them ? "Them" : "You";
  const locked = report.locked;
  const all = (locked ? report.searchPreview : report.allSearches) || [];
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const list = useMemo(() => {
    let l = all.filter((q) => filter === "all" || (filter === "missed" && !q.found) || (filter === "won" && q.found) || (filter === "mine" && q.mine));
    if (sort.key) {
      const k = sort.key;
      l = l.slice().sort((a, b) => sort.dir * (k === "question" ? a.question.localeCompare(b.question) : k === "category" ? (a.category || "").localeCompare(b.category || "") : k === "position" ? (a.position || (a.found ? 50 : 99)) - (b.position || (b.found ? 50 : 99)) : RANK[a.opp] - RANK[b.opp]));
    }
    return l;
  }, [all, filter, sort]);

  if (!all.length) return null;

  const by = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));
  const head = (
    <thead>
      <tr>
        <th>{locked ? "Question" : <button type="button" onClick={() => by("question")}>Question</button>}</th>
        <th>{locked ? "Type" : <button type="button" onClick={() => by("category")}>Type</button>}</th>
        <th>{locked ? self : <button type="button" onClick={() => by("position")}>{self}</button>}</th>
        <th>AI picked</th>
        <th>{locked ? "Opportunity" : <button type="button" onClick={() => by("opp")}>Opportunity</button>}</th>
      </tr>
    </thead>
  );

  if (locked) {
    return (
      <div className="card" id="r-questions">
        <div className="qx-top">
          <h3>Every shopper question we asked AI</h3>
        </div>
        <div className="qx-wrap">
          <table className="qx">
            {head}
            <tbody>
              <Rows list={all} self={self} />
            </tbody>
          </table>
        </div>
        {report.hidden?.searches > 0 && (
          <div className="qx-lock">
            <div className="qx-wrap blurred" aria-hidden="true">
              <table className="qx">
                <tbody>
                  {Array.from({ length: Math.min(4, report.hidden.searches) }, (_, i) => (
                    <tr key={i}>
                      <td className="q">A hidden shopper question about {report.category}</td>
                      <td>Type</td>
                      <td>
                        <span className={`chip ${i % 2 ? "green" : "red"}`}>{i % 2 ? "2nd" : "Missed"}</span>
                      </td>
                      <td className="who">Hidden stores</td>
                      <td>{OPP.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="qx-cover">
              <p>+ {report.hidden.searches} more questions, with who AI picked in each, in the full report</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const missed = all.filter((q) => !q.found).length;
  const mine = all.filter((q) => q.mine).length;
  const tabs = [
    ["all", `All ${all.length}`],
    ["missed", `Missed ${missed}`],
    ["won", `Won ${all.length - missed}`],
    ...(mine ? [["mine", `Your questions ${mine}`]] : []),
  ];
  const o = report.opportunity;

  return (
    <div className="card" id="r-questions">
      <div className="qx-top">
        <h3>Every shopper question we asked AI</h3>
        <div className="seg2" role="group" aria-label="Filter questions">
          {tabs.map(([k, t]) => (
            <button type="button" key={k} className={filter === k ? "on" : ""} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="qx-wrap">
        <table className="qx">
          {head}
          <tbody>
            {list.length ? (
              <Rows list={list} self={self} />
            ) : (
              <tr>
                <td colSpan={5} className="muted">
                  No questions here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="note-sm">
        “Opportunity” is worked out from what we saw: whether {them ? "they" : "you"} came up, how many other stores did, and how close it was.
        {all.some((q) => q.picks) ? " Tap a column heading to sort." : ""}
      </p>
      {o && (
        <div className="opp">
          <div className="opp-ic" aria-hidden="true">
            !
          </div>
          <p>
            <b>Biggest opportunity: {o.category === "Your question" ? "your own questions" : `${o.category.toLowerCase()} questions`}.</b> {them ? "They" : "You"} missed {o.missed} of {o.total}
            {o.winner ? `, and ${o.winner.name} came up in ${o.winner.count} of them` : ""}.{" "}
            {(report.fixes || []).length > 0 && <a href="#r-fixes">{them ? "See how to beat them →" : "See what to fix →"}</a>}
          </p>
        </div>
      )}
    </div>
  );
}
