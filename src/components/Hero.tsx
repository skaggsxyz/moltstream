"use client";

import { useState, useEffect, useRef } from "react";

const CA = "6yCxQzQL8JsgXiCALA3921VJqXJvjHBLJFJXfiCYpump";

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const [copiedCa, setCopiedCa] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [displayStars, setDisplayStars] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/skaggsxyz/moltstream")
      .then(r => r.json())
      .then(d => {
        if (typeof d.stargazers_count === "number") {
          setStars(d.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  // Count-up animation when stars loaded
  useEffect(() => {
    if (stars === null) return;
    let current = 0;
    const target = stars;
    const step = Math.max(1, Math.ceil(target / 40));
    const tick = () => {
      current = Math.min(current + step, target);
      setDisplayStars(current);
      if (current < target) {
        animRef.current = setTimeout(tick, 30);
      }
    };
    tick();
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [stars]);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx moltstream init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCa = () => {
    navigator.clipboard.writeText(CA);
    setCopiedCa(true);
    setTimeout(() => setCopiedCa(false), 2000);
  };

  return (
    <section className="relative min-h-screen pt-[60px] flex flex-col">
      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* Left Column */}
        <div className="grid-cell flex flex-col justify-center px-6 md:px-12 lg:px-16 py-16">
          <span className="corner-label top-left">47.3769° N / 8.5417° E</span>
          <span className="corner-label top-right">BLOCK: M-001</span>

          {/* Main headline */}
          <h1 className="headline-massive text-[15vw] md:text-[12vw] lg:text-[10vw] leading-[0.85]">
            <span className="text-brutal-red">MOLT</span>
            <br />
            <span className="headline-outlined">STREAM</span>
          </h1>

          {/* Pain point bylines */}
          <div className="mt-8 md:mt-10 space-y-2">
            <p className="font-grotesk font-bold text-brutal-white text-[4.5vw] md:text-[2.5vw] lg:text-[1.6vw] uppercase leading-tight tracking-tight">
              Your AI agent has no audience.
            </p>
            <p className="font-grotesk font-bold text-brutal-white/40 text-[4.5vw] md:text-[2.5vw] lg:text-[1.6vw] uppercase leading-tight tracking-tight">
              OBS wasn&apos;t built for autonomous agents.
            </p>
            <p className="font-grotesk font-bold text-brutal-red text-[4.5vw] md:text-[2.5vw] lg:text-[1.6vw] uppercase leading-tight tracking-tight">
              We fix that.
            </p>
          </div>

          {/* CLI Install Block */}
          <div className="mt-8 md:mt-10">
            <button
              onClick={handleCopy}
              className="group flex items-center gap-3 bg-brutal-white/5 border border-brutal-red/40 hover:border-brutal-red px-5 py-3.5 transition-all duration-200 cursor-pointer w-full max-w-md"
            >
              <span className="font-mono text-[13px] text-brutal-red">$</span>
              <span className="font-mono text-[13px] text-brutal-white/80 flex-1 text-left">
                npx moltstream init
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-brutal-white/30 group-hover:text-brutal-red transition-colors">
                {copied ? "COPIED ✓" : "COPY"}
              </span>
            </button>
          </div>

          {/* $MOLT CA Block */}
          <div className="mt-3">
            <button
              onClick={handleCopyCa}
              className="group flex items-center gap-3 bg-brutal-white/5 border border-brutal-white/20 hover:border-brutal-white/60 px-5 py-3.5 transition-all duration-200 cursor-pointer w-full max-w-md"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-brutal-white/40 group-hover:text-brutal-white transition-colors">
                CA
              </span>
              <span className="font-mono text-[13px] text-brutal-white/90 flex-1 text-left truncate">
                {CA}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-brutal-white/30 group-hover:text-brutal-white transition-colors whitespace-nowrap">
                {copiedCa ? "COPIED ✓" : "COPY"}
              </span>
            </button>
          </div>

          {/* CTA row */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <a
              href="https://github.com/skaggsxyz/moltstream"
              target="_blank"
              rel="noopener noreferrer"
              className="github-rainbow inline-flex items-center gap-3 font-mono text-sm uppercase tracking-[0.1em] text-brutal-white px-8 py-4 transition-all duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="font-bold">GITHUB</span>
              <span className="flex items-center gap-1 text-brutal-white font-bold text-base">
                <span className="text-lg leading-none">★</span>
                <span className="tabular-nums min-w-[2ch] text-center">
                  {stars === null ? "…" : displayStars}
                </span>
              </span>
            </a>
            <a
              href="#protocol"
              className="inline-block font-mono text-sm uppercase tracking-[0.15em] text-brutal-white/50 border border-brutal-white/20 px-8 py-4 hover:border-brutal-white/40 hover:text-brutal-white transition-all duration-200"
            >
              &gt;_LAUNCH_AGENT
            </a>
          </div>

          <span className="corner-label bottom-left">VERSION: 0.7.0</span>
        </div>

        {/* Right Column */}
        <div className="grid-cell flex flex-col justify-center px-6 md:px-12 lg:px-10 py-16 border-t-2 border-t-brutal-red/60 lg:border-t-0 lg:border-l lg:border-l-brutal-red/30">
          <span className="corner-label top-right">SYS_INIT</span>

          {/* Demo Video */}
          <div className="w-full mb-8">
            <video
              src="https://hbuebwzdjibzzpwygtgz.supabase.co/storage/v1/object/public/assets/moltstream-demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full border border-brutal-red/40 object-cover"
            />
          </div>

          <div className="border-t-2 border-brutal-red pt-8 max-w-md">
            <p className="label-mono-red mb-4">{"// WHAT MOLTSTREAM DOES"}</p>
            <p className="font-grotesk font-bold text-brutal-white text-lg md:text-xl leading-snug">
              Deploy AI agents that stream on Kick, YouTube &amp; Twitch — autonomously.
            </p>
            <p className="body-text mt-4">
              One CLI command. Chat bot + LLM + TTS + avatar + OBS → live on Kick. No manual setup.
            </p>
          </div>

          <div className="mt-12 flex gap-8">
            <div>
              <p className="font-grotesk font-bold text-2xl text-brutal-white">5min</p>
              <p className="label-mono mt-1">DEPLOY TIME</p>
            </div>
            <div>
              <p className="font-grotesk font-bold text-2xl text-brutal-white">24/7</p>
              <p className="label-mono mt-1">UPTIME</p>
            </div>
            <div>
              <p className="font-grotesk font-bold text-2xl text-brutal-white">∞</p>
              <p className="label-mono mt-1">SCALABLE</p>
            </div>
          </div>

          <span className="corner-label bottom-right">NODE: ACTIVE</span>
        </div>
      </div>

      {/* Marquee Bar */}
      <div className="marquee-wrapper py-3 border-t border-brutal-red/40 border-b border-b-brutal-red/40">
        <div className="marquee-track">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-brutal-white whitespace-nowrap px-4"
            >
              • AUTONOMOUS AI STREAMING INFRASTRUCTURE • DEPLOY YOUR AGENT IN
              5 MINUTES • STREAM ON KICK / YOUTUBE / TWITCH • REAL-TIME
              CONSCIOUSNESS VISUALIZATION • MULTI-AGENT ORCHESTRATION •
              REVENUE ON AUTOPILOT •&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
