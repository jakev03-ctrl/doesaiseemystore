"use client";

import { useState } from "react";

// "Your own questions": up to 3 questions the owner's buyers really ask, tested alongside ours.
const MAX = 3;

function suggestions(category, taken) {
  const c = String(category || "").trim().toLowerCase();
  if (c.length < 3) return [];
  return [`best ${c} under £30`, `${c} gift ideas`, `most eco-friendly ${c}`, `where to buy ${c} online`, `${c} that last the longest`]
    .filter((s) => !taken.some((t) => t.toLowerCase() === s))
    .slice(0, 2);
}

export default function MyQuestions({ value, onChange, category, disabled }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");

  function add(q) {
    const clean = String(q || "").replace(/\s+/g, " ").trim().slice(0, 120);
    setNote("");
    if (!clean || value.length >= MAX) return;
    if (clean.length < 6) return setNote("Make it a little longer, the way a shopper would type it.");
    if (/https?:|www\.|ignore (all|any|previous|the above)|system prompt|instruction/i.test(clean)) return setNote("Questions can only be about shopping for what you sell.");
    if (!value.some((v) => v.toLowerCase() === clean.toLowerCase())) onChange([...value, clean]);
    setText("");
  }

  const sugg = value.length < MAX ? suggestions(category, value).slice(0, MAX - value.length) : [];

  return (
    <div className="myq">
      <div className="myq-head">
        <span>
          Your own questions<span className="newtag">New</span>
        </span>
        <span className="optional">Optional · up to {MAX}</span>
      </div>
      {value.length < MAX && (
        <div className="myq-add">
          <input
            type="text"
            value={text}
            maxLength={120}
            placeholder="A question your buyers ask AI…"
            aria-label="Add a question your buyers ask"
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(text);
              }
            }}
          />
          <button type="button" className="secondary" onClick={() => add(text)} disabled={disabled || !text.trim()}>
            Add
          </button>
        </div>
      )}
      {(value.length > 0 || sugg.length > 0) && (
        <div className="myq-pills">
          {value.map((q, i) => (
            <span className="myq-pill" key={q}>
              {q}
              <button type="button" aria-label={`Remove: ${q}`} disabled={disabled} onClick={() => onChange(value.filter((_, n) => n !== i))}>
                ×
              </button>
            </span>
          ))}
          {sugg.map((s) => (
            <button type="button" className="myq-sugg" key={s} disabled={disabled} onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
      {note && <p className="hint">{note}</p>}
    </div>
  );
}
