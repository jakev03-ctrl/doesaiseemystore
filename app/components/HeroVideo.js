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
  const [state, setState] = useState("idle"); // idle | starting | playing | paused | ended
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    window.addEventListener("themechange", read);
    return () => window.removeEventListener("themechange", read);
  }, []);

  // Start the video. Safari sometimes refuses while it's still fading in, so keep trying quietly
  // for a couple of seconds before showing a Play button.
  const retry = useRef(null);
  function play(fromStart, attempt = 0) {
    const v = vid.current;
    if (!v) return;
    clearTimeout(retry.current);
    v.muted = true; // Safari only allows silent videos to start by themselves
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.playsInline = true;
    if (fromStart) {
      try {
        v.currentTime = 0;
      } catch {}
    }
    const p = v.play();
    if (p && p.catch) {
      p.catch(() => {
        if (attempt < 6) {
          setState("starting");
          retry.current = setTimeout(() => {
            if (wantRef.current) play(false, attempt + 1);
          }, [250, 500, 800, 1200, 1800, 2500][attempt]);
        } else setState("paused");
      });
    }
  }

  // It sits right under the title. It appears (and starts from the beginning) after the first
  // bit of scrolling, plays while at least half of it is on screen, and pauses when it leaves.
  const ratio = useRef(0);
  const revealedRef = useRef(false);
  const playingRef = useRef(false);
  const seenRef = useRef(false);
  const wantRef = useRef(false);

  function sync() {
    const v = vid.current;
    const want = revealedRef.current && ratio.current >= 0.5;
    wantRef.current = want;
    if (!v) return;
    if (want && !playingRef.current) {
      playingRef.current = true;
      play(!seenRef.current || v.ended);
      seenRef.current = true;
    } else if (!want && playingRef.current) {
      playingRef.current = false;
      v.pause();
    }
  }

  useEffect(() => {
    const onScroll = () => {
      const r = window.scrollY > 90;
      if (r !== revealedRef.current) {
        revealedRef.current = r;
        if (r) setInView(true);
        sync();
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const el = wrap.current;
    let io;
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([e]) => {
          ratio.current = e.intersectionRatio;
          sync();
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      io.observe(el);
    } else ratio.current = 1;
    playingRef.current = false;
    return () => {
      clearTimeout(retry.current);
      window.removeEventListener("scroll", onScroll);
      io && io.disconnect();
    };
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
            autoPlay
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
        {!failed && (state === "paused" || state === "ended") && (
          <button type="button" className="vid-play" onClick={tap} aria-label={state === "ended" ? "Watch again" : "Play the video"}>
            {state === "ended" ? "↻ Watch again" : "▶ Play"}
          </button>
        )}
      </div>
    </section>
  );
}
