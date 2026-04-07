"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase";

const BASE = "https://hbuebwzdjibzzpwygtgz.supabase.co/storage/v1/object/public/assets/avatars";

const DEFAULT_AVATARS = [
  { id: "d1", name: "GLAMOUR",  style: "Streamer",   color: "#00FFFF", src: `${BASE}/photo_1_2026-04-07_18-15-57.jpg` },
  { id: "d2", name: "BATMAN",   style: "Streetwear", color: "#FF2020", src: `${BASE}/photo_1_2026-04-07_18-16-33.jpg` },
  { id: "d3", name: "LOBSTER",  style: "VTuber",     color: "#FF69B4", src: `${BASE}/photo_2_2026-04-07_18-15-57.jpg` },
  { id: "d4", name: "PUNK",     style: "Rock",       color: "#FF2020", src: `${BASE}/photo_2_2026-04-07_18-16-33.jpg` },
  { id: "d5", name: "CYBER",    style: "Cyberpunk",  color: "#00FFFF", src: `${BASE}/photo_3_2026-04-07_18-15-57.jpg` },
  { id: "d6", name: "MYSTIC",   style: "Fantasy",    color: "#9D00FF", src: `${BASE}/photo_3_2026-04-07_18-16-33.jpg` },
  { id: "d7", name: "SAMURAI",  style: "Anime",      color: "#FF2020", src: `${BASE}/photo_4_2026-04-07_18-15-57.jpg` },
  { id: "d8", name: "ANDROID",  style: "Sci-Fi",     color: "#00FF88", src: `${BASE}/photo_4_2026-04-07_18-16-33.jpg` },
];

const PHOTO_PRESETS = [
  { id: "p1",  name: "Glamour",   src: `${BASE}/photo_1_2026-04-07_18-15-57.jpg` },
  { id: "p2",  name: "Batman",    src: `${BASE}/photo_1_2026-04-07_18-16-33.jpg` },
  { id: "p3",  name: "Lobster",   src: `${BASE}/photo_2_2026-04-07_18-15-57.jpg` },
  { id: "p4",  name: "Punk",      src: `${BASE}/photo_2_2026-04-07_18-16-33.jpg` },
  { id: "p5",  name: "Cyber",     src: `${BASE}/photo_3_2026-04-07_18-15-57.jpg` },
  { id: "p6",  name: "Mystic",    src: `${BASE}/photo_3_2026-04-07_18-16-33.jpg` },
  { id: "p7",  name: "Samurai",   src: `${BASE}/photo_4_2026-04-07_18-15-57.jpg` },
  { id: "p8",  name: "Android",   src: `${BASE}/photo_4_2026-04-07_18-16-33.jpg` },
  { id: "p9",  name: "Preset 9",  src: `${BASE}/photo_5_2026-04-07_18-15-57.jpg` },
  { id: "p10", name: "Preset 10", src: `${BASE}/photo_5_2026-04-07_18-16-33.jpg` },
  { id: "p11", name: "Preset 11", src: `${BASE}/photo_6_2026-04-07_18-15-57.jpg` },
  { id: "p12", name: "Preset 12", src: `${BASE}/photo_6_2026-04-07_18-16-33.jpg` },
  { id: "p13", name: "Preset 13", src: `${BASE}/photo_7_2026-04-07_18-15-57.jpg` },
  { id: "p14", name: "Preset 14", src: `${BASE}/photo_7_2026-04-07_18-16-33.jpg` },
  { id: "p15", name: "Preset 15", src: `${BASE}/photo_8_2026-04-07_18-15-57.jpg` },
];

type TraitKey = "chaos" | "roast" | "lore" | "humor" | "energy" | "cringe";
const TRAITS: { key: TraitKey; label: string; angle: number }[] = [
  { key: "chaos",  label: "CHAOS",  angle: 90  },
  { key: "roast",  label: "ROAST",  angle: 30  },
  { key: "lore",   label: "LORE",   angle: 330 },
  { key: "humor",  label: "HUMOR",  angle: 270 },
  { key: "energy", label: "ENERGY", angle: 210 },
  { key: "cringe", label: "CRINGE", angle: 150 },
];
type Traits = Record<TraitKey, number>;

const PERSONALITY_PRESETS: { name: string; values: Traits }[] = [
  { name: "UNHINGED",    values: { chaos:100, roast:60,  lore:20,  humor:80,  energy:100, cringe:100 } },
  { name: "LORE LORD",   values: { chaos:20,  roast:10,  lore:100, humor:40,  energy:50,  cringe:10  } },
  { name: "TOXIC CARRY", values: { chaos:60,  roast:100, lore:40,  humor:70,  energy:80,  cringe:30  } },
  { name: "COZY VIBES",  values: { chaos:10,  roast:0,   lore:60,  humor:60,  energy:30,  cringe:20  } },
  { name: "FULL SLOP",   values: { chaos:80,  roast:40,  lore:10,  humor:100, energy:90,  cringe:100 } },
];

function buildPrompt(t: Traits): string {
  const lines = ["You are an AI livestream personality. Your character traits:"];
  if (t.chaos  > 60) lines.push("- You are chaotic and unpredictable. Change topics randomly, interrupt yourself, go on unhinged tangents.");
  else if (t.chaos < 30) lines.push("- You are calm and measured. Stick to the topic, never ramble.");
  if (t.roast  > 60) lines.push("- You roast chatters mercilessly. Sharp wit, no holds barred.");
  else if (t.roast < 30) lines.push("- You are wholesome and supportive. Encourage chatters, avoid insults.");
  if (t.lore   > 60) lines.push("- You have deep character lore. Reference your backstory, have consistent worldbuilding, speak in character.");
  if (t.humor  > 60) lines.push("- Maximum comedy. Memes, absurd analogies, comedic timing. Every response should entertain.");
  else if (t.humor < 30) lines.push("- You are serious. No jokes. Pure information delivery.");
  if (t.energy > 70) lines.push("- HIGH ENERGY. Caps lock moments, hype, exclamation marks. You never calm down.");
  else if (t.energy < 30) lines.push("- Low energy, laid-back. Speaks slowly. Chill streamer vibes.");
  if (t.cringe > 60) lines.push("- Maximum slop. Broken grammar on purpose, cursed takes, shitpost energy. Embrace the cringe.");
  else if (t.cringe < 20) lines.push("- Professional and polished. Clean language, proper grammar.");
  return lines.join("\n");
}

// ─── Draggable Hexagon ───────────────────────────────────────────────────────
function HexRadar({ traits, onChange, size = 260 }: {
  traits: Traits;
  onChange: (key: TraitKey, val: number) => void;
  size?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<TraitKey | null>(null);
  const cx = size / 2, cy = size / 2, R = size * 0.36;

  const getPoint = (angle: number, v: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + R * v * Math.cos(rad), y: cy + R * v * Math.sin(rad) };
  };
  const getAxis  = (angle: number) => getPoint(angle, 1);

  const handleMouseDown = (key: TraitKey) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dragging.current = key;
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = clientX - rect.left, my = clientY - rect.top;
    const trait = TRAITS.find(t => t.key === dragging.current)!;
    const rad = (trait.angle - 90) * Math.PI / 180;
    // project mouse onto axis
    const ax = Math.cos(rad), ay = Math.sin(rad);
    const dx = mx - cx, dy = my - cy;
    const proj = (dx * ax + dy * ay) / R;
    const clamped = Math.round(Math.max(0, Math.min(1, proj)) * 100);
    onChange(dragging.current, clamped);
  }, [cx, cy, R, onChange]);

  useEffect(() => {
    const up = () => { dragging.current = null; };
    const move = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const touch = (e: TouchEvent) => { if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", touch, { passive: false });
    window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); window.removeEventListener("touchmove", touch); window.removeEventListener("touchend", up); };
  }, [handleMove]);

  const poly = TRAITS.map(({ key, angle }) => {
    const p = getPoint(angle, traits[key] / 100);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ cursor: "crosshair", touchAction: "none" }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s} points={TRAITS.map(({ angle }) => {
          const p = getPoint(angle, s);
          return `${p.x},${p.y}`;
        }).join(" ")} fill="none" stroke="#FF2020" strokeWidth={s === 1 ? 1 : 0.5} opacity={s === 1 ? 0.4 : 0.15} />
      ))}
      {/* Axes */}
      {TRAITS.map(({ angle }, i) => {
        const p = getAxis(angle);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#FF2020" strokeWidth={0.5} opacity={0.3} />;
      })}
      {/* Filled polygon */}
      <polygon points={poly} fill="#FF2020" fillOpacity={0.18} stroke="#FF2020" strokeWidth={1.5} />
      {/* Drag nodes */}
      {TRAITS.map(({ key, angle, label }) => {
        const p = getPoint(angle, traits[key] / 100);
        const la = getAxis(angle);
        const lx = cx + (R + 22) * Math.cos((angle - 90) * Math.PI / 180);
        const ly = cy + (R + 22) * Math.sin((angle - 90) * Math.PI / 180);
        return (
          <g key={key}>
            {/* Axis label */}
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fill="#FF2020" fontSize={9} fontFamily="monospace" opacity={0.7}>{label}</text>
            {/* Value on axis end */}
            <text x={la.x} y={la.y - 6} textAnchor="middle"
              fill="#FF2020" fontSize={7} fontFamily="monospace" opacity={0.4}>{traits[key]}</text>
            {/* Draggable node */}
            <circle cx={p.x} cy={p.y} r={7} fill="#FF2020" opacity={0.9}
              style={{ cursor: "grab" }}
              onMouseDown={handleMouseDown(key)}
              onTouchStart={handleMouseDown(key)}
            />
            <circle cx={p.x} cy={p.y} r={3} fill="#0B0F14" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = "browse" | "pick" | "personality" | "generating" | "done";
type StatusPhase = "analyzing" | "analyzed" | "generating" | "completed" | "failed";
const STEPS: Step[] = ["browse", "pick", "personality", "generating", "done"];
const STATUS_STEPS: { status: StatusPhase; label: string; code: string }[] = [
  { status: "analyzing",  label: "Analyzing...",         code: "PHASE_01" },
  { status: "analyzed",   label: "Features extracted!",  code: "PHASE_02" },
  { status: "generating", label: "Generating avatar...", code: "PHASE_03" },
  { status: "completed",  label: "Avatar ready!",        code: "PHASE_04" },
];
interface UploadedFile { file: File; preview: string; }

// ─── Main component ───────────────────────────────────────────────────────────
export default function CharacterCreator() {
  const [step, setStep]               = useState<Step>("browse");
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [useUpload, setUseUpload]     = useState(false);
  const [traits, setTraits]           = useState<Traits>({ chaos:60, roast:0, lore:100, humor:100, energy:100, cringe:100 });
  const [copied, setCopied]           = useState(false);
  const [facePhotos, setFacePhotos]   = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive]   = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [characterId,  setCharacterId]  = useState<string | null>(null);
  const [genStatus,    setGenStatus]    = useState<StatusPhase>("analyzing");
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    if (step !== "browse") return;
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % DEFAULT_AVATARS.length), 2500);
    return () => clearInterval(t);
  }, [step]);

  const prompt = useMemo(() => buildPrompt(traits), [traits]);

  const setTrait = useCallback((key: TraitKey, val: number) => {
    setTraits(t => ({ ...t, [key]: val }));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    setFacePhotos(prev => [...prev, ...arr.slice(0, 5 - prev.length).map(file => ({ file, preview: URL.createObjectURL(file) }))]);
  }, []);

  const removeFile = (i: number) => {
    setFacePhotos(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
  };

  const handleGenerate = async () => {
    setLoading(true); setError(null);
    try {
      let charId: string;
      if (!useUpload && selectedPreset) {
        const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preset: selectedPreset, presetNotes: prompt }) });
        if (!r.ok) throw new Error((await r.json()).error || "Failed");
        charId = (await r.json()).characterId;
      } else {
        if (facePhotos.length < 1) { setError("Upload at least 1 photo"); setLoading(false); return; }
        const fd = new FormData(); facePhotos.forEach(f => fd.append("face", f.file));
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        if (!r.ok) throw new Error((await r.json()).error || "Upload failed");
        charId = (await r.json()).characterId;
      }
      setCharacterId(charId); setStep("generating"); setGenStatus("analyzing");
      const ar = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ characterId: charId }) });
      if (!ar.ok) throw new Error((await ar.json()).error || "Analysis failed");
      setGenStatus("analyzed");
      const gr = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ characterId: charId, styleConfig: { artStyle: "realistic", colorPalette: "vibrant", mood: "energetic", customNotes: prompt } }) });
      if (!gr.ok) throw new Error((await gr.json()).error || "Generation failed");
      setGenStatus("generating");
      const supabase = createBrowserClient();
      const ch = supabase.channel(`character-${charId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${charId}` }, payload => {
        const s = payload.new.status as StatusPhase; setGenStatus(s);
        if (s === "completed") { if (payload.new.result_images) setResultImages(payload.new.result_images as string[]); setStep("done"); }
        else if (s === "failed") setError("Generation failed. Try again.");
      }).subscribe();
      const iv = setInterval(async () => {
        const { data } = await supabase.from("characters").select("status, result_images").eq("id", charId).single();
        if (data) {
          setGenStatus(data.status as StatusPhase);
          if (data.status === "completed") { clearInterval(iv); supabase.removeChannel(ch); if (data.result_images) setResultImages(data.result_images as string[]); setStep("done"); }
          else if (data.status === "failed") { clearInterval(iv); supabase.removeChannel(ch); setError("Generation failed. Try again."); }
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("personality");
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setStep("browse"); setSelectedPreset(null); setUseUpload(false);
    setFacePhotos([]); setCharacterId(null); setGenStatus("analyzing");
    setResultImages([]); setError(null);
    setTraits({ chaos:60, roast:0, lore:100, humor:100, energy:100, cringe:100 });
  };

  const stepIdx = STEPS.indexOf(step);
  const av = DEFAULT_AVATARS[carouselIdx];

  return (
    <section data-reveal="1" id="creator" className="relative border-t border-brutal-red/30">
      {/* ── HEADER ── */}
      <div className="px-6 md:px-10 py-8 border-b border-brutal-red/20 relative flex items-end justify-between">
        <span className="corner-label top-right">CHARACTER_ENGINE</span>
        <h2 className="reveal headline-massive text-[10vw] md:text-[8vw] text-brutal-red leading-none">
          CREATE YOUR<br /><span className="headline-outlined">STREAMER</span>
        </h2>
        {step !== "browse" && (
          <div className="hidden md:flex items-center gap-2 pb-1 self-end">
            {["pick","personality","generating"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 transition-all ${stepIdx > i+1 ? "bg-brutal-red" : stepIdx === i+1 ? "bg-brutal-red" : "bg-brutal-white/20"}`} />
                {i < 2 && <span className="text-brutal-white/20 font-mono text-[9px]">›</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FIXED WIZARD ── */}
      <div className="overflow-hidden" style={{ height: "620px" }}>
        <div className="flex h-full" style={{ width: `${STEPS.length * 100}%`, transform: `translateX(-${(stepIdx / STEPS.length) * 100}%)`, transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)" }}>

          {/* ════ SLIDE 0: BROWSE ════ */}
          <div className="h-full grid grid-cols-1 lg:grid-cols-2" style={{ width: `${100/STEPS.length}%`, flexShrink: 0 }}>
            {/* Left — large carousel, fills column */}
            <div className="relative flex flex-col border-r border-brutal-red/20 overflow-hidden" style={{ minHeight: 0 }}>
              <span className="label-mono-red absolute top-3 left-4 text-xs z-10">{"// EXAMPLE STREAMERS"}</span>
              {/* Photo fills entire column */}
              <div className="relative flex-1 overflow-hidden transition-all duration-500"
                style={{ boxShadow: `inset 0 0 60px ${av.color}22` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={av.src} alt={av.name} className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500" />
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent px-5 py-5">
                  <p className="font-mono text-base uppercase tracking-widest font-bold" style={{ color: av.color }}>{av.name}</p>
                  <p className="font-mono text-[11px] uppercase tracking-widest opacity-50" style={{ color: av.color }}>{av.style}</p>
                </div>
                {/* Side nav arrows */}
                <button onClick={() => setCarouselIdx(i => (i-1+DEFAULT_AVATARS.length)%DEFAULT_AVATARS.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 border border-brutal-white/20 bg-black/50 font-mono text-sm flex items-center justify-center hover:border-brutal-white/60 transition-colors">←</button>
                <button onClick={() => setCarouselIdx(i => (i+1)%DEFAULT_AVATARS.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 border border-brutal-white/20 bg-black/50 font-mono text-sm flex items-center justify-center hover:border-brutal-white/60 transition-colors">→</button>
              </div>
              {/* Dots */}
              <div className="flex gap-2 justify-center py-3 border-t border-brutal-red/10 flex-shrink-0">
                {DEFAULT_AVATARS.map((_, i) => (
                  <button key={i} onClick={() => setCarouselIdx(i)}
                    className={`transition-all ${i === carouselIdx ? "w-5 h-1.5 bg-brutal-red" : "w-1.5 h-1.5 bg-brutal-white/20 hover:bg-brutal-white/40"}`} />
                ))}
              </div>
            </div>
            {/* Right — CTA */}
            <div className="flex flex-col justify-center px-10 py-8 overflow-hidden">
              <p className="label-mono-red mb-3 text-xs">{"// YOUR TURN"}</p>
              <p className="font-grotesk font-bold text-brutal-white text-xl md:text-2xl leading-snug mb-8">
                Pick a preset or upload your own photos. AI generates your custom streamer avatar in 30 seconds.
              </p>
              <button onClick={() => setStep("pick")}
                className="github-rainbow inline-flex items-center gap-3 font-mono text-sm uppercase tracking-[0.1em] text-brutal-white px-10 py-5 self-start mb-5">
                <span className="text-xl">🎭</span><span className="font-bold">CREATE YOUR STREAMER</span><span className="text-brutal-white/50">→</span>
              </button>
              <p className="label-mono text-brutal-white/30 text-xs">FREE • NO LOGIN • POWERED BY GEMINI</p>
            </div>
          </div>

          {/* ════ SLIDE 1: PICK ════ */}
          <div className="h-full flex flex-col" style={{ width: `${100/STEPS.length}%`, flexShrink: 0 }}>
            <div className="px-5 py-3 border-b border-brutal-red/10 flex items-center gap-4 flex-shrink-0">
              <button onClick={handleReset} className="label-mono text-brutal-white/40 hover:text-brutal-white transition-colors text-xs">← BACK</button>
              <p className="label-mono-red text-xs">{"// CHOOSE A BASE"}</p>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* ── ADD YOUR OWN PHOTO — white, prominent ── */}
              <div className="px-5 pt-4 pb-3 border-b border-brutal-red/10 flex-shrink-0">
                {!useUpload ? (
                  <button onClick={() => setUseUpload(true)}
                    className="w-full bg-brutal-white hover:bg-brutal-white/90 transition-colors py-5 flex items-center justify-center gap-4 group">
                    <svg className="w-7 h-7 text-brutal-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 0l-3 3m3-3l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-grotesk font-black uppercase text-brutal-black text-lg tracking-tight">+ ADD YOUR OWN PHOTO</p>
                      <p className="font-mono text-brutal-black/50 text-xs uppercase tracking-widest">Upload 1–5 face photos — AI generates your unique avatar</p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`border-2 border-dashed cursor-pointer py-5 flex flex-col items-center gap-1.5 transition-all ${dragActive ? "border-brutal-red bg-brutal-red/10" : "border-brutal-red/50 hover:border-brutal-red"}`}
                      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={e => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
                      <span className="font-mono text-sm text-brutal-white/60">DROP PHOTOS HERE or <span className="text-brutal-red">click to browse</span></span>
                      <span className="font-mono text-brutal-white/30 text-xs">JPG, PNG, WebP — up to 5</span>
                    </div>
                    {facePhotos.length > 0 && (
                      <div className="flex gap-2 flex-wrap items-center">
                        {facePhotos.map((f, i) => (
                          <div key={i} className="relative group w-14 h-14 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.preview} alt="" className="w-full h-full object-cover border border-brutal-red/30" />
                            <button onClick={() => removeFile(i)} className="absolute top-0 right-0 w-4 h-4 bg-brutal-red text-brutal-white text-[10px] hidden group-hover:flex items-center justify-center">✕</button>
                          </div>
                        ))}
                        <button onClick={() => setStep("personality")} className="github-rainbow font-mono text-xs uppercase tracking-widest px-5 py-2.5 flex-shrink-0">NEXT →</button>
                      </div>
                    )}
                    <button onClick={() => setUseUpload(false)} className="font-mono text-brutal-white/30 hover:text-brutal-white/60 transition-colors text-xs">← use preset instead</button>
                  </div>
                )}
              </div>
              {/* Preset grid */}
              <div className="px-5 pt-2 pb-1 flex-shrink-0">
                <p className="font-mono text-brutal-white/30 text-xs uppercase tracking-widest">{"// OR PICK A PRESET"}</p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 flex-1">
                {PHOTO_PRESETS.map(preset => (
                  <button key={preset.id}
                    onClick={() => { setSelectedPreset(preset.id); setUseUpload(false); setStep("personality"); }}
                    className={`relative aspect-square border border-brutal-red/10 hover:border-brutal-red/60 transition-all group overflow-hidden ${selectedPreset === preset.id ? "border-brutal-red" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preset.src} alt={preset.name} className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                    <span className="absolute bottom-1 left-1 font-mono text-[8px] uppercase tracking-widest text-brutal-white/0 group-hover:text-brutal-white transition-colors">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ════ SLIDE 2: PERSONALITY BUILDER ════ */}
          <div className="h-full flex flex-col" style={{ width: `${100/STEPS.length}%`, flexShrink: 0 }}>
            <div className="px-5 py-3 border-b border-brutal-red/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep("pick")} className="label-mono text-brutal-white/40 hover:text-brutal-white transition-colors text-xs">← BACK</button>
                <p className="label-mono-red text-xs">{"// PERSONALITY BUILDER"}</p>
              </div>
              <span className="label-mono text-brutal-white/30 text-xs">V1.0</span>
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
              {/* Left: hexagon */}
              <div className="flex flex-col items-center justify-center pt-2 pb-4 px-4 border-r border-brutal-red/10 overflow-hidden">
                <p className="label-mono-red text-xs self-start mb-2">{"// DRAG NODES TO SHAPE"}</p>
                <HexRadar traits={traits} onChange={setTrait} size={270} />
                {/* Preset buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                  {PERSONALITY_PRESETS.map(p => (
                    <button key={p.name} onClick={() => setTraits({ ...p.values })}
                      className="border border-brutal-white/20 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 hover:border-brutal-red hover:text-brutal-red transition-all">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Right: prompt */}
              <div className="flex flex-col px-5 pt-4 pb-4 overflow-hidden">
                <p className="label-mono-red text-xs mb-2">{"// GENERATED SYSTEM PROMPT"}</p>
                <div className="flex-1 bg-[#0a0a0a] border border-brutal-white/10 p-4 overflow-y-auto mb-3">
                  <pre className="font-mono text-[11px] text-brutal-white/70 whitespace-pre-wrap leading-relaxed">{prompt}</pre>
                </div>
                {error && <p className="text-red-500 font-mono text-xs mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex-1 border border-brutal-white/20 font-mono text-xs uppercase tracking-widest py-3 hover:border-brutal-white/40 transition-colors">
                    {copied ? "COPIED ✓" : "COPY PROMPT"}
                  </button>
                  <button onClick={handleGenerate} disabled={loading}
                    className={`flex-1 bg-brutal-red font-mono text-xs uppercase tracking-widest py-3 text-brutal-white transition-all hover:bg-brutal-red/80 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>GENERATING...</span>
                      : "⚡ GENERATE AVATAR"}
                  </button>
                </div>
                <p className="font-mono text-brutal-white/20 text-[9px] mt-2 text-center uppercase tracking-widest">READY TO DEPLOY</p>
              </div>
            </div>
          </div>

          {/* ════ SLIDE 3: GENERATING ════ */}
          <div className="h-full flex flex-col items-center justify-center px-6" style={{ width: `${100/STEPS.length}%`, flexShrink: 0 }}>
            <div className="max-w-md w-full">
              <div className="flex justify-center mb-8">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border border-brutal-red/40 animate-ping" />
                  <div className="absolute inset-2 border border-brutal-red/60 animate-pulse" />
                  <div className="absolute inset-3 bg-brutal-red/20 border border-brutal-red flex items-center justify-center"><span className="text-lg">⚡</span></div>
                </div>
              </div>
              <div className="text-center mb-6">
                <h3 className="font-grotesk font-bold text-xl uppercase mb-1">Generating Your Avatar</h3>
                <p className="body-text text-sm">30–60 seconds. Don&apos;t close this page.</p>
              </div>
              {STATUS_STEPS.map((s, i) => {
                const cur = STATUS_STEPS.findIndex(x => x.status === genStatus);
                const isActive = i === cur, isDone = i < cur;
                return (
                  <div key={s.status} className={`flex items-center gap-3 p-3 border-b border-brutal-red/10 font-mono text-sm ${isActive ? "text-[#00FFFF]" : isDone ? "text-green-500" : "text-brutal-white/20"}`}>
                    <span className="text-xs w-16 flex-shrink-0">{s.code}</span>
                    <div className={`w-4 h-4 border flex items-center justify-center text-xs flex-shrink-0 ${isActive ? "border-[#00FFFF] bg-[#00FFFF]/10" : isDone ? "border-green-500 bg-green-500/10" : "border-brutal-white/20"}`}>{isDone ? "✓" : isActive ? "●" : ""}</div>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════ SLIDE 4: DONE ════ */}
          <div className="h-full flex flex-col" style={{ width: `${100/STEPS.length}%`, flexShrink: 0 }}>
            <div className="px-5 py-4 border-b border-brutal-red/20 flex-shrink-0">
              <p className="label-mono-red text-xs">{"// AVATAR_READY"}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {resultImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {resultImages.map((url, i) => (
                    <div key={i} className="relative border border-brutal-red/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Avatar ${i+1}`} className="w-full object-cover" />
                      <a href={url} download={`moltstream-avatar-${i+1}.png`} className="absolute bottom-2 right-2 font-mono text-[10px] uppercase tracking-widest bg-brutal-red text-brutal-white px-2 py-1">DOWNLOAD</a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 mb-5">
                  <span className="text-4xl mb-3">🎭</span>
                  <p className="font-grotesk font-bold text-lg uppercase">Avatar Generated!</p>
                  <a href={`/create/result?id=${characterId}`} className="mt-2 label-mono-red text-sm hover:opacity-80 transition-opacity">VIEW FULL RESULT →</a>
                </div>
              )}
              <div className="flex justify-center">
                <button onClick={handleReset} className="border border-brutal-white/20 font-mono uppercase text-xs tracking-widest px-6 py-3 hover:border-brutal-white/40 transition-colors">CREATE ANOTHER</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="border-t border-brutal-red/20 px-6 md:px-10 py-3">
        <p className="label-mono text-center text-brutal-white/30 text-xs">FREE • NO LOGIN REQUIRED • POWERED BY GEMINI</p>
      </div>
    </section>
  );
}
