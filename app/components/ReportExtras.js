// v35 report sections: the replay, where AI looks, results per assistant, what AI says about you,
// and which of your products AI knows. All built from the real searches in the report.

const ord = (n) => `${n}${n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th"}`;

function money(cur, p) {
  if (!p) return "";
  const n = Number(String(p).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  const v = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/, "");
  return `${cur || ""}${v}`;
}

// The AI answer, readable: plain lines, numbered lines as a list, bold markers removed.
function AnswerText({ text }) {
  const lines = String(text || "")
    .replace(/\*\*|__/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const out = [];
  let list = null;
  lines.forEach((l, i) => {
    const m = l.match(/^(?:\d+[.)]|[-•*])\s+(.*)$/);
    if (m) {
      if (!list) {
        list = [];
        out.push(<ol key={`l${i}`}>{list}</ol>);
      }
      list.push(<li key={i}>{m[1].replace(/^#+\s*/, "")}</li>);
    } else {
      list = null;
      out.push(<p key={i}>{l.replace(/^#+\s*/, "")}</p>);
    }
  });
  return <div className="rp-text">{out}</div>;
}

function Blur({ n, children }) {
  if (!n) return null;
  return (
    <div className="xr-more blurred" aria-hidden="true">
      {Array.from({ length: Math.min(n, 3) }, (_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  );
}

export function Replay({ report }) {
  const r = report.replay;
  if (!r) return null;
  const them = report.subject === "them";
  const name = report.shop?.name || (them ? "This store" : "Your store");
  const price = r.match ? money(report.currency, r.match.price) : "";
  return (
    <div className="card replay" id="r-replay">
      <div className="xr-head">
        <h3>Replay: what a shopper saw</h3>
        <span className="lockchip">{r.assistant} · live web search</span>
      </div>
      <p className="muted small">
        One of {them ? "their" : "your"} searches, exactly as AI answered it.{" "}
        {r.found ? `${name} came up, but not first.` : "This is the moment the sale went elsewhere."}
      </p>
      <div className="rp-grid">
        <div className="rp-chat">
          <div className="rp-q">{r.question}</div>
          <div className="rp-a">
            <AnswerText text={r.text} />
            {r.hosts?.length > 0 && (
              <div className="rp-src">
                {r.hosts.map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
            )}
          </div>
          {r.found ? (
            <div className="rp-flag low">
              <b>{name} came {ord(r.position || 2)}.</b> Shoppers usually go with the first store AI names.
            </div>
          ) : (
            <div className="rp-flag">
              <span aria-hidden="true">✕</span>
              <div>
                <b>{name} wasn't mentioned.</b>
                {r.match?.title ? ` ${them ? "They sell" : "You sell"} ${r.match.title}${price ? ` for ${price}` : ""}, which fits this search.` : ""}
              </div>
            </div>
          )}
        </div>
        <div className="rp-why">
          <h4>{r.found ? "Why AI put others first" : `Why AI chose them, not ${them ? name : "you"}`}</h4>
          {r.why?.length > 0 ? (
            <ol>
              {r.why.map((x, i) => (
                <li key={i}>
                  <b>{x.title}</b>
                  <span>{x.detail}</span>
                </li>
              ))}
            </ol>
          ) : r.whyHidden > 0 ? (
            <div className="rp-lock">
              <div className="blurred" aria-hidden="true">
                <ol>
                  {Array.from({ length: Math.min(3, r.whyHidden) }, (_, i) => (
                    <li key={i}>
                      <b>A hidden reason AI picked them</b>
                      <span>What they show that your pages don't, in plain words.</span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="small">The reasons are in the full report.</p>
            </div>
          ) : (
            <p className="muted small">AI didn't give clear reasons for this one.</p>
          )}
          {r.picks?.length > 0 && !report.locked && (
            <p className="note-sm">AI recommended: {r.picks.join(", ")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DugDeeper({ report }) {
  const d = report.dugDeeper;
  if (!d) return null;
  const them = report.subject === "them";
  const who = them ? "they" : "you";
  return (
    <div className="card deeper">
      <span className="deeper-ic" aria-hidden="true">
        ⤵
      </span>
      <p>
        <b>We dug deeper into "{d.category}".</b> {who === "you" ? "You" : "They"} were missed there, so we asked AI {d.count} more, narrower
        questions in that area.{" "}
        {d.found > 0
          ? `${who === "you" ? "You" : "They"} came up in ${d.found} of them, so it's specific questions, not the whole area.`
          : `${who === "you" ? "You" : "They"} didn't come up in any of them, so AI is missing ${who === "you" ? "you" : "them"} across this whole area.`}
      </p>
    </div>
  );
}

export function Assistants({ report }) {
  const list = report.assistants || [];
  if (list.length < 2) return null;
  return (
    <div className="card">
      <h3>How each AI assistant sees {report.subject === "them" ? "them" : "you"}</h3>
      <p className="muted small">Different AI assistants, same searches. Each square is one search.</p>
      <div className="asx">
        {list.map((a) => (
          <div className="asx-row" key={a.label}>
            <b>{a.label}</b>
            <span className="sq big" aria-hidden="true">
              {Array.from({ length: Math.min(a.checked, 14) }, (_, i) => (
                <i key={i} className={i < a.found ? "on" : ""} />
              ))}
            </span>
            <span className="asx-n">
              {a.found} of {a.checked}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sources({ report }) {
  const list = report.sources || [];
  const hidden = report.hidden?.sources || 0;
  if (!list.length) return null;
  const max = Math.max(...list.map((s) => s.count), 1);
  const them = report.subject === "them";
  return (
    <div className="card">
      <div className="xr-head">
        <h3>Where AI gets its answers</h3>
        {report.locked && hidden > 0 && <span className="lockchip">+{hidden} more in full report</span>}
      </div>
      <p className="muted small">The websites AI read before choosing who to recommend. Get mentioned on these and AI is more likely to notice {them ? "a store" : "you"}.</p>
      <div className="xr-bars">
        {list.map((s) => (
          <div className={`xr-bar${s.you ? " you" : ""}`} key={s.host}>
            <span className="xr-l">{s.you ? `${s.host} (${them ? "their site" : "your site"})` : s.host}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${Math.max(6, (s.count / max) * 100)}%` }} />
            </span>
            <span className="xr-v">
              {s.count} {s.count === 1 ? "search" : "searches"}
            </span>
          </div>
        ))}
      </div>
      <Blur n={report.locked ? hidden : 0}>
        <div className="xr-bar">
          <span className="xr-l">hidden-website.com</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: "30%" }} />
          </span>
          <span className="xr-v">2 searches</span>
        </div>
      </Blur>
    </div>
  );
}

const VERDICT = {
  right: ["good", "✓ Right"],
  partly: ["mid", "≈ Partly"],
  wrong: ["bad", "✕ Wrong"],
  missing: ["bad", "✕ Missing"],
  unknown: ["muted", "? Can't tell"],
};

export function Accuracy({ report }) {
  const list = report.accuracy || [];
  const hidden = report.hidden?.accuracy || 0;
  if (!list.length) return null;
  const them = report.subject === "them";
  const bad = list.filter((a) => a.verdict === "wrong" || a.verdict === "missing").length;
  return (
    <div className="card">
      <div className="xr-head">
        <h3>What AI says about {them ? "them" : "you"}</h3>
        {bad > 0 && !report.locked && <span className="chip red">{bad} to fix</span>}
        {report.locked && hidden > 0 && <span className="lockchip">+{hidden} more in full report</span>}
      </div>
      <p className="muted small">
        We asked AI about {report.shop?.name || "the store"} by name and compared its answer with {them ? "their" : "your"} own website. Wrong answers lose
        sales even when AI does mention {them ? "them" : "you"}.
      </p>
      <div className="acc">
        {list.map((a, i) => (
          <div className="acc-row" key={i}>
            <b className="acc-t">{a.topic}</b>
            <div className="acc-ai">
              <span className="acc-k">AI said</span>
              {a.ai}
            </div>
            <div className="acc-st">
              <span className="acc-k">{them ? "Their site" : "Your site"}</span>
              {a.store}
            </div>
            <span className={`acc-v ${VERDICT[a.verdict]?.[0] || "muted"}`}>{VERDICT[a.verdict]?.[1] || "?"}</span>
          </div>
        ))}
      </div>
      <Blur n={report.locked ? hidden : 0}>
        <div className="acc-row">
          <b className="acc-t">Returns</b>
          <div className="acc-ai">A hidden answer</div>
          <div className="acc-st">What the site says</div>
          <span className="acc-v bad">✕ Wrong</span>
        </div>
      </Blur>
    </div>
  );
}

export function Products({ report }) {
  const list = report.products || [];
  const hidden = report.hidden?.products || 0;
  if (!list.length) return null;
  const them = report.subject === "them";
  return (
    <div className="card">
      <div className="xr-head">
        <h3>{them ? "Their" : "Your"} products, through AI's eyes</h3>
        {report.locked && hidden > 0 && <span className="lockchip">+{hidden} more in full report</span>}
      </div>
      <p className="muted small">Which of {them ? "their" : "your"} products AI named in its answers.</p>
      <div className="prods">
        {list.map((p, i) => (
          <div className="prod" key={i}>
            <div className="prod-ic" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
            </div>
            <b>{p.url && !report.locked ? <a href={p.url} target="_blank" rel="noopener noreferrer nofollow">{p.title}</a> : p.title}</b>
            {money(report.currency, p.price) && <span className="prod-p">{money(report.currency, p.price)}</span>}
            <span className={`chip ${p.mentions > 0 ? "green" : "red"}`}>
              {p.mentions > 1 ? `Mentioned in ${p.mentions} answers` : p.mentions === 1 ? "Mentioned once" : "Never mentioned"}
            </span>
          </div>
        ))}
      </div>
      {list.every((p) => !p.mentions) && (
        <p className="note-sm">AI didn't name any of these products. Clear names, details and prices on each product page help AI recommend them directly.</p>
      )}
    </div>
  );
}
