// Shared look for the social share images (1200 x 630).
export const OG_SIZE = { width: 1200, height: 630 };

// A fixed scattering of stars so every image looks the same.
const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = (n) => {
    const x = Math.sin(i * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  return { x: Math.round(r(1) * 1200), y: Math.round(r(2) * 630), s: r(3) < 0.2 ? 3 : 2, o: 0.25 + r(4) * 0.6 };
});

// The stars sit inside ONE wrapper div, so the image generator receives a single
// element (it can't handle a bare list of elements next to other items).
export function stars() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex" }}>
      {STARS.map((st, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: st.x,
            top: st.y,
            width: st.s,
            height: st.s,
            borderRadius: 99,
            background: `rgba(220, 230, 255, ${st.o})`,
          }}
        />
      ))}
    </div>
  );
}

export const background = {
  width: "100%",
  height: "100%",
  display: "flex",
  position: "relative",
  backgroundColor: "#040817",
  backgroundImage:
    "radial-gradient(circle at 80% 15%, rgba(88, 110, 255, 0.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(120, 70, 255, 0.25), transparent 45%)",
  color: "#ffffff",
};

// Called as a plain function ({logo()}).
export function logo() {
  return (
    <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
      <span>DoesAI</span>
      <span style={{ color: "#9dbbff" }}>See</span>
      <span>MyStore</span>
    </div>
  );
}
