"use client";

import { useEffect, useRef, useState } from "react";

const LETTERS = ["Q", "L", "O", "T", "H", "E"];
const SEEN_KEY = "qlothe_intro_seen";
const HOLD_MS = 2700; // how long the intro plays before lifting
const LIFT_MS = 750; // matches the transition duration below

/**
 * First-visit brand opener: forest-green curtain, the horseman mark revolving
 * in, QLOTHE letters rising one by one, then the whole curtain lifts to reveal
 * the page. Plays once per session; any scroll/tap/keypress skips it.
 */
export function BrandIntro() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");
  const done = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) {
      done.current = true;
      setPhase("gone");
      return;
    }

    const leave = () => {
      if (done.current) return;
      done.current = true;
      sessionStorage.setItem(SEEN_KEY, "1");
      setPhase("leave");
      setTimeout(() => setPhase("gone"), LIFT_MS);
    };

    const auto = setTimeout(leave, HOLD_MS);
    const opts = { passive: true } as const;
    window.addEventListener("wheel", leave, opts);
    window.addEventListener("touchstart", leave, opts);
    window.addEventListener("keydown", leave);
    window.addEventListener("pointerdown", leave);

    return () => {
      clearTimeout(auto);
      window.removeEventListener("wheel", leave);
      window.removeEventListener("touchstart", leave);
      window.removeEventListener("keydown", leave);
      window.removeEventListener("pointerdown", leave);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-forest transition-transform duration-700 ease-[cubic-bezier(.65,0,.35,1)] ${
        phase === "leave" ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ perspective: "900px" }}
    >
      {/* revolving mark — the engraving is forest-on-transparent, inverted to white */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        className="qintro-mark h-32 w-32 object-contain md:h-44 md:w-44"
        style={{ filter: "brightness(0) invert(1)" }}
      />

      {/* letters rise in sequence: Q, then L, then O… */}
      <div className="flex select-none font-serif text-[13vw] font-bold uppercase leading-none tracking-[.12em] text-white md:text-7xl">
        {LETTERS.map((l, i) => (
          <span key={i} className="qintro-letter" style={{ animationDelay: `${0.9 + i * 0.13}s` }}>
            {l}
          </span>
        ))}
      </div>

      <div
        className="qintro-letter font-mono text-[10px] uppercase tracking-[.3em] text-white/50 md:text-[11px]"
        style={{ animationDelay: "1.9s" }}
      >
        Heritage Print Shop · Est. Bombay
      </div>

      <div
        className="qintro-letter absolute bottom-8 font-mono text-[10px] uppercase tracking-[.2em] text-white/35"
        style={{ animationDelay: "2.2s" }}
      >
        Scroll to enter
      </div>
    </div>
  );
}
