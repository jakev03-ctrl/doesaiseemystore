// Rank and store-type badges: the logo's eye opens as AI sees a store more,
// and the colour warms from slate to gold as it ranks up.
const W = "#ffffff";
const EYE = (o) => `M22 60 C38 ${60 - o} 82 ${60 - o} 98 60 C82 ${60 + o} 38 ${60 + o} 22 60 Z`;
const GRAD = {
  ghost: ["#5d6785", "#3a4260"],
  whisper: ["#4f7ad8", "#3a56b8"],
  radar: ["#2f6df6", "#3f4fe0"],
  contender: ["#4b55e8", "#6a3fd6"],
  favourite: ["#f2b544", "#e07b2e"],
  fav: ["#f2b544", "#e07b2e"],
  gem: ["#2fc4b2", "#2f6df6"],
  reputation: ["#6a3fd6", "#c04fd6"],
  starting: ["#2f6df6", "#2fc4b2"],
};

function spark(x, y, r) {
  const a = r * 0.18;
  return `M${x} ${y - r} C${x + a} ${y - a} ${x + a} ${y - a} ${x + r} ${y} C${x + a} ${y + a} ${x + a} ${y + a} ${x} ${y + r} C${x - a} ${y + a} ${x - a} ${y + a} ${x - r} ${y} C${x - a} ${y - a} ${x - a} ${y - a} ${x} ${y - r} Z`;
}
function star(x, y, r) {
  let p = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    p += `${i ? "L" : "M"}${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`;
  }
  return p + "Z";
}

const S = { fill: "none", stroke: W, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" };

function Glyph({ k }) {
  switch (k) {
    case "ghost":
      return (
        <>
          <path d="M24 56 C40 72 80 72 96 56" {...S} strokeDasharray="7 7" />
          <path d="M38 68 l-5 8 M60 72 v9 M82 68 l5 8" {...S} opacity=".7" />
        </>
      );
    case "whisper":
      return (
        <>
          <path d={EYE(9)} {...S} />
          <circle cx="60" cy="60" r="5" fill={W} />
        </>
      );
    case "contender":
      return (
        <>
          <path d={EYE(24)} {...S} />
          <circle cx="60" cy="60" r="12" {...S} />
          <circle cx="60" cy="60" r="4.5" fill={W} />
          <path d={spark(96, 26, 8)} fill={W} />
          <path d={spark(24, 96, 5)} fill={W} />
        </>
      );
    case "favourite":
      return (
        <>
          <path d={EYE(26)} {...S} />
          <circle cx="60" cy="60" r="14" fill={W} />
          <path d={star(60, 60, 9)} fill="#e58a33" />
          <path d={spark(60, 16, 8)} fill={W} />
          <path d={spark(34, 24, 5)} fill={W} />
          <path d={spark(86, 24, 5)} fill={W} />
        </>
      );
    case "fav":
      return (
        <>
          <path d="M60 18 L94 30 V58 C94 80 79 95 60 102 C41 95 26 80 26 58 V30 Z" {...S} />
          <path d={star(60, 60, 15)} fill={W} />
        </>
      );
    case "gem":
      return (
        <>
          <path d="M36 34 H84 L100 52 L60 98 L20 52 Z" {...S} />
          <path d="M20 52 H100 M48 34 L42 52 L60 98 L78 52 L72 34" {...S} strokeWidth="4" />
        </>
      );
    case "reputation":
      return (
        <>
          <path d="M18 86 C34 86 36 62 52 62 C68 62 70 80 84 66 L100 44" {...S} />
          <path d="M84 42 H101 V59" {...S} />
          <circle cx="18" cy="86" r="5" fill={W} />
        </>
      );
    case "starting":
      return (
        <>
          <path d="M36 100 V22" {...S} />
          <path d="M36 26 C50 18 62 34 78 26 C84 23 90 24 94 26 V60 C88 56 82 56 76 60 C62 68 50 52 36 60" {...S} />
          <path d="M22 100 H98" {...S} strokeDasharray="8 7" />
        </>
      );
    default: // radar
      return (
        <>
          <path d={EYE(20)} {...S} />
          <circle cx="60" cy="60" r="9" fill={W} />
          <path d="M86 30 a14 14 0 0 1 10 10 M90 20 a26 26 0 0 1 18 18" {...S} strokeWidth="4.5" />
        </>
      );
  }
}

function Tile({ k, size, title }) {
  const id = `bg${k}${size}`;
  const [a, b] = GRAD[k] || GRAD.radar;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={title} style={{ flex: "none" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="30" fill={`url(#${id})`} />
      <rect x=".75" y=".75" width="118.5" height="118.5" rx="29.3" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.5" />
      <g transform="translate(60 60) scale(.8) translate(-60 -60)">
        <Glyph k={k} />
      </g>
    </svg>
  );
}

export function RankBadge({ rank = "radar", size = 40 }) {
  return <Tile k={rank} size={size} title="Rank" />;
}
export function TypeBadge({ type = "starting", size = 40 }) {
  return <Tile k={type === "favourite" ? "fav" : type} size={size} title="Store type" />;
}
