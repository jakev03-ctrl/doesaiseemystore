"use client";

import { useEffect, useRef, useState } from "react";

// The "how it works" demo under the title. It isn't a video file: it's the animation itself,
// drawn live on the page (public/media/demo.html), so browsers can't block it from playing.
// It starts from the beginning after the first bit of scrolling, pauses when it's off screen,
// can be tapped to pause or play, and shows "Watch again" at the end.
export default function HeroVideo() {
  const wrap = useRef(null);
  const frame = useRef(null);
  const [inView, setInView] = useState(false);
  const [state, setState] = useState("idle"); // idle | playing | paused | ended
  const ready = useRef(false);
  const revealed = useRef(false);
  const ratio = useRef(0);
  const playing = useRef(false);
  const seen = useRef(false);
  const ended = useRef(false);
  const userPaused = useRef(false); // they tapped pause: don't restart it on our own until it leaves the screen

  const demo = () => {
    try {
      return frame.current?.contentWindow;
    } catch {
      return null;
    }
  };

  function sync() {
    const w = demo();
    if (!w?.demoPlay) return; // demo not loaded yet: we'll be called again as soon as it is
    const want = revealed.current && ratio.current >= 0.5;
    if (!want) userPaused.current = false;
    if (want && !playing.current && !ended.current && !userPaused.current) {
      playing.current = true;
      w.demoPlay(!seen.current);
      seen.current = true;
    } else if (!want && playing.current) {
      playing.current = false;
      w.demoPause();
    }
  }

  useEffect(() => {
    // Messages from the demo (playing / paused / ended).
    const onMsg = (e) => {
      if (e.source !== demo() || !e.data?.demo) return;
      const s = e.data.demo;
      setState(s);
      if (s === "ended") {
        ended.current = true;
        playing.current = false;
      }
    };
    window.addEventListener("message", onMsg);

    // Follow the light/dark switch.
    const onTheme = () => demo()?.demoTheme?.(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    window.addEventListener("themechange", onTheme);

    const onScroll = () => {
      const r = window.scrollY > 90;
      if (r !== revealed.current) {
        revealed.current = r;
        setInView(r);
        if (!r) {
          // Back at the top: hide it, and play it from the start next time.
          seen.current = false;
          ended.current = false;
          userPaused.current = false;
          setState("idle");
        }
        sync();
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    let io;
    if (wrap.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([e]) => {
          ratio.current = e.intersectionRatio;
          sync();
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      io.observe(wrap.current);
    } else ratio.current = 1;

    // On the live site the demo can finish loading before this code is listening, so the
    // "loaded" signal is missed. Check every 200ms until it's there, then start it.
    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      if (demo()?.demoPlay) {
        clearInterval(poll);
        onLoad();
      } else if (tries > 100) clearInterval(poll);
    }, 200);

    return () => {
      clearInterval(poll);
      window.removeEventListener("message", onMsg);
      window.removeEventListener("themechange", onTheme);
      window.removeEventListener("scroll", onScroll);
      io && io.disconnect();
    };
  }, []);

  function onLoad() {
    ready.current = true;
    demo()?.demoTheme?.(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    sync();
  }

  function tap() {
    const w = demo();
    if (!w?.demoPlay) return;
    if (ended.current) {
      ended.current = false;
      userPaused.current = false;
      playing.current = true;
      w.demoPlay(true);
    } else if (playing.current) {
      userPaused.current = true;
      playing.current = false;
      w.demoPause();
    } else {
      userPaused.current = false;
      playing.current = true;
      w.demoPlay(false);
    }
  }

  return (
    <section className={`vidsec${inView ? " in" : ""}`} aria-label="How it works">
      <div className="vidbox demo" ref={wrap}>
        <iframe
          ref={frame}
          src="/media/demo.html"
          title="A 10 second demo: enter your store, then see your AI score, who AI picks instead, key stats and what to fix"
          onLoad={onLoad}
          scrolling="no"
          tabIndex={-1}
          loading="eager"
        />
        <button type="button" className="demo-tap" onClick={tap} aria-label={state === "playing" ? "Pause the demo" : "Play the demo"} />
        {(state === "paused" || state === "ended") && (
          <button type="button" className="vid-play" onClick={tap} aria-label={state === "ended" ? "Watch again" : "Play the demo"}>
            {state === "ended" ? "↻ Watch again" : "▶ Play"}
          </button>
        )}
      </div>
    </section>
  );
}
