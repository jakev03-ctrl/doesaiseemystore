"use client";

import { useEffect, useRef, useState } from "react";

// The "how it works" video under the title. It plays by itself (silently) when it scrolls into view,
// pauses when it leaves, and can be tapped to play, pause or watch again.
// No masks or heavy effects on the video itself: the soft edges are a light overlay on top.
export default function HeroVideo() {
  const wrap = useRef(null);
  const vid = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [inView, setInView] = useState(false);
  const [state, setState] = useState("idle"); // idle | playing | paused | ended
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);

  function play(fromStart) {
    const v = vid.current;
    if (!v) return;
    v.muted = true; // Safari only allows silent videos to start by themselves
    v.setAttribute("muted", "");
    v.playsInline = true;
    if (fromStart) {
      try {
        v.currentTime = 0;
      } catch {}
    }
    const p = v.play();
    if (p && p.catch) p.catch(() => setState("paused"));
  }

  // Fade in as it arrives; play when at least half of it is on screen, pause when it leaves.
  useEffect(() => {
    const el = wrap.current;
    if (!el || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    let seen = false;
    let playingNow = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio > 0.12) setInView(true);
        const v = vid.current;
        if (!v) return;
        const want = e.intersectionRatio >= 0.5;
        if (want && !playingNow) {
          playingNow = true;
          play(!seen || v.ended);
          seen = true;
        } else if (!want && playingNow) {
          playingNow = false;
          v.pause();
        }
      },
      { threshold: [0, 0.12, 0.5, 0.75] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [theme]);

  function tap() {
    const v = vid.current;
    if (!v) return;
    if (v.ended || state === "ended") play(true);
    else if (v.paused) play(false);
    else v.pause();
  }

  return (
    <section className={`vidsec${inView ? " in" : ""}`} aria-label="How it works">
      <div className="vidbox" ref={wrap}>
        {failed ? (
          <img src={`/media/how-it-works-${theme}.jpg`} alt="A DoesAISeeMyStore report: your AI score, who AI picks instead, key stats and what to fix" />
        ) : (
          <video
            ref={vid}
            key={theme}
            poster={`/media/how-it-works-${theme}-start.jpg`}
            muted
            playsInline
            preload="auto"
            onClick={tap}
            onPlay={() => setState("playing")}
            onPause={() => setState((s) => (vid.current?.ended ? "ended" : "paused"))}
            onEnded={() => setState("ended")}
            onError={() => setFailed(true)}
            aria-label="A 10 second demo: enter your store, then see your AI score, who AI picks instead, key stats and what to fix"
          >
            <source src={`/media/how-it-works-${theme}.mp4`} type="video/mp4" />
          </video>
        )}
        <div className="vid-edge" aria-hidden="true" />
        {!failed && state !== "playing" && (
          <button type="button" className="vid-play" onClick={tap} aria-label={state === "ended" ? "Watch again" : "Play the video"}>
            {state === "ended" ? "↻ Watch again" : "▶ Play"}
          </button>
        )}
      </div>
    </section>
  );
}
