"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ART_STYLES = [
  { id: "anime", name: "ANIME", desc: "Vibrant anime aesthetic", emoji: "🎌" },
  { id: "realistic", name: "REALISTIC", desc: "Photorealistic digital art", emoji: "📸" },
  { id: "pixel", name: "PIXEL ART", desc: "Retro 32-bit style", emoji: "👾" },
  { id: "cyberpunk", name: "CYBERPUNK", desc: "Neon-lit futuristic", emoji: "🌃" },
  { id: "watercolor", name: "WATERCOLOR", desc: "Soft painterly style", emoji: "🎨" },
  { id: "comic", name: "COMIC BOOK", desc: "Bold comic art", emoji: "💥" },
  { id: "3d-render", name: "3D RENDER", desc: "Pixar/Disney quality", emoji: "🧊" },
  { id: "fantasy", name: "FANTASY", desc: "Magical RPG style", emoji: "⚔️" },
] as const;

const COLOR_PALETTES = [
  "neon", "pastel", "muted", "vibrant", "monochrome", "warm", "cool",
];

const MOODS = [
  "energetic", "chill", "mysterious", "fierce", "friendly", "dark", "playful",
];

function StylePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("id");

  const [artStyle, setArtStyle] = useState<string>("anime");
  const [colorPalette, setColorPalette] = useState<string>("neon");
  const [mood, setMood] = useState<string>("energetic");
  const [outfit, setOutfit] = useState("");
  const [accessories, setAccessories] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      router.push("/create");
    }
  }, [characterId, router]);

  const handleGenerate = async () => {
    if (!characterId) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Step 1: Analyze photos
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });

      if (!analyzeRes.ok) {
        const data = await analyzeRes.json();
        throw new Error(data.error || "Analysis failed");
      }

      // Step 2: Trigger generation
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          styleConfig: {
            artStyle,
            colorPalette,
            mood,
            outfit: outfit || undefined,
            accessories: accessories
              ? accessories.split(",").map((s) => s.trim())
              : undefined,
            customNotes: customNotes || undefined,
          },
        }),
      });

      if (!generateRes.ok) {
        const data = await generateRes.json();
        throw new Error(data.error || "Generation failed");
      }

      router.push(`/create/generate?id=${characterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAnalyzing(false);
    }
  };

  if (!characterId) return null;

  return (
    <main className="min-h-screen bg-[#0B0F14] text-brutal-white">
      {/* Page header */}
      <div className="border-b border-brutal-red/30 px-6 md:px-10 py-8 relative">
        <span className="corner-label top-right">STEP_03 / STYLE</span>
        <p className="label-mono-red mb-3">{"// CHARACTER_CREATOR"}</p>
        <h1 className="headline-massive text-[8vw] md:text-[5vw] text-brutal-white">
          DESIGN
          <br />
          <span className="headline-outlined">YOUR STYLE</span>
        </h1>
        <p className="body-text mt-4 max-w-2xl">
          Choose how your avatar should look — AI will match your features to
          the selected style.
        </p>
      </div>

      <div className="px-6 md:px-10 py-10 space-y-12">
        {/* Art style grid */}
        <section className="space-y-6">
          <div className="border-b border-brutal-red/20 pb-4">
            <p className="label-mono-red">{"// ART_STYLE"}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {ART_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setArtStyle(style.id)}
                className={`grid-cell text-left transition-colors hover:bg-brutal-red/5 ${
                  artStyle === style.id
                    ? "bg-brutal-red/10 border-brutal-red/60"
                    : ""
                }`}
              >
                <span className="corner-label-cyan">{style.id.toUpperCase()}</span>
                <div className="text-3xl mb-3">{style.emoji}</div>
                <div className="font-grotesk font-bold text-sm text-brutal-white uppercase mb-1">
                  {style.name}
                </div>
                <div className="body-text text-xs">{style.desc}</div>
                {artStyle === style.id && (
                  <div className="mt-3">
                    <span className="label-mono-red">SELECTED</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Color palette */}
        <section className="space-y-6">
          <div className="border-b border-brutal-red/20 pb-4">
            <p className="label-mono-red">{"// COLOR_PALETTE"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTES.map((p) => (
              <button
                key={p}
                onClick={() => setColorPalette(p)}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-all ${
                  colorPalette === p
                    ? "border-brutal-red text-brutal-red bg-brutal-red/10"
                    : "border-brutal-white/20 text-brutal-white/40 hover:border-brutal-white/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Mood */}
        <section className="space-y-6">
          <div className="border-b border-brutal-red/20 pb-4">
            <p className="label-mono-red">{"// MOOD_ENERGY"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-all ${
                  mood === m
                    ? "border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/10"
                    : "border-brutal-white/20 text-brutal-white/40 hover:border-brutal-white/40"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        {/* Custom fields */}
        <section className="space-y-6">
          <div className="border-b border-brutal-red/20 pb-4">
            <p className="label-mono-red">{"// CUSTOM_OPTIONS"}</p>
            <span className="label-mono ml-4">optional</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid-cell">
              <span className="corner-label-cyan">OUTFIT</span>
              <label className="label-mono block mb-3">Outfit</label>
              <input
                type="text"
                value={outfit}
                onChange={(e) => setOutfit(e.target.value)}
                placeholder="e.g. Cyberpunk hoodie with LED trim"
                className="w-full bg-transparent border-b border-brutal-white/20 py-2 font-mono text-sm
                  text-brutal-white placeholder:text-brutal-white/20
                  focus:outline-none focus:border-brutal-red transition-colors"
              />
            </div>
            <div className="grid-cell">
              <span className="corner-label-cyan">ACCESSORIES</span>
              <label className="label-mono block mb-3">Accessories (comma-separated)</label>
              <input
                type="text"
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
                placeholder="e.g. headphones, glasses, earrings"
                className="w-full bg-transparent border-b border-brutal-white/20 py-2 font-mono text-sm
                  text-brutal-white placeholder:text-brutal-white/20
                  focus:outline-none focus:border-brutal-red transition-colors"
              />
            </div>
          </div>
          <div className="grid-cell">
            <span className="corner-label-cyan">NOTES</span>
            <label className="label-mono block mb-3">Additional Notes</label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Any other details about how you want your avatar to look..."
              rows={3}
              className="w-full bg-transparent border-b border-brutal-white/20 py-2 font-mono text-sm
                text-brutal-white placeholder:text-brutal-white/20
                focus:outline-none focus:border-brutal-red transition-colors resize-none"
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="grid-cell border-red-500/50 bg-red-500/5">
            <p className="text-red-500 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Generate button */}
        <div className="flex justify-center pt-4 pb-16">
          <button
            onClick={handleGenerate}
            disabled={analyzing}
            className={`github-rainbow font-mono text-sm uppercase tracking-[0.1em] text-brutal-white px-10 py-5 transition-all duration-200 ${
              analyzing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {analyzing ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                ANALYZING & GENERATING...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <span className="text-lg">⚡</span>
                <span className="font-bold">GENERATE AVATAR</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function StylePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
          <p className="label-mono">LOADING...</p>
        </div>
      }
    >
      <StylePageContent />
    </Suspense>
  );
}
