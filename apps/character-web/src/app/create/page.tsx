"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ART_STYLES = [
  {
    id: "anime",
    name: "Anime",
    desc: "Vibrant anime aesthetic",
    emoji: "🎌",
  },
  {
    id: "realistic",
    name: "Realistic",
    desc: "Photorealistic digital art",
    emoji: "📸",
  },
  {
    id: "pixel",
    name: "Pixel Art",
    desc: "Retro 32-bit style",
    emoji: "👾",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    desc: "Neon-lit futuristic",
    emoji: "🌃",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    desc: "Soft painterly style",
    emoji: "🎨",
  },
  {
    id: "comic",
    name: "Comic Book",
    desc: "Bold comic art",
    emoji: "💥",
  },
  {
    id: "3d-render",
    name: "3D Render",
    desc: "Pixar/Disney quality",
    emoji: "🧊",
  },
  {
    id: "fantasy",
    name: "Fantasy",
    desc: "Magical RPG style",
    emoji: "⚔️",
  },
] as const;

const COLOR_PALETTES = [
  "neon",
  "pastel",
  "muted",
  "vibrant",
  "monochrome",
  "warm",
  "cool",
];

const MOODS = [
  "energetic",
  "chill",
  "mysterious",
  "fierce",
  "friendly",
  "dark",
  "playful",
];

function CreatePageContent() {
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
      router.push("/");
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

      router.push(`/generate?id=${characterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAnalyzing(false);
    }
  };

  if (!characterId) return null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          Design Your <span className="neon-text">Style</span>
        </h1>
        <p className="text-molt-muted">
          Choose how your avatar should look — AI will match your features to
          the selected style
        </p>
      </div>

      {/* Art style grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Art Style</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ART_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setArtStyle(style.id)}
              className={`card text-left transition-all duration-200 hover:border-molt-accent/50 ${
                artStyle === style.id
                  ? "border-molt-accent shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                  : ""
              }`}
            >
              <div className="text-2xl mb-2">{style.emoji}</div>
              <div className="font-semibold text-sm">{style.name}</div>
              <div className="text-xs text-molt-muted">{style.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Color palette */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Color Palette</h2>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTES.map((p) => (
            <button
              key={p}
              onClick={() => setColorPalette(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                colorPalette === p
                  ? "border-molt-accent text-molt-accent bg-molt-accent/10"
                  : "border-molt-border text-molt-muted hover:border-molt-accent/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Mood */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mood / Energy</h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                mood === m
                  ? "border-molt-accent-2 text-molt-accent-2 bg-molt-accent-2/10"
                  : "border-molt-border text-molt-muted hover:border-molt-accent-2/50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* Custom fields */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Customize{" "}
          <span className="text-molt-muted text-sm font-normal">
            (optional)
          </span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-molt-muted mb-1">
              Outfit
            </label>
            <input
              type="text"
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
              placeholder="e.g. Cyberpunk hoodie with LED trim"
              className="w-full bg-molt-bg border border-molt-border rounded-lg px-4 py-2.5
                text-molt-text placeholder:text-molt-muted/50
                focus:outline-none focus:border-molt-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-molt-muted mb-1">
              Accessories (comma-separated)
            </label>
            <input
              type="text"
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
              placeholder="e.g. headphones, glasses, earrings"
              className="w-full bg-molt-bg border border-molt-border rounded-lg px-4 py-2.5
                text-molt-text placeholder:text-molt-muted/50
                focus:outline-none focus:border-molt-accent transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-molt-muted mb-1">
            Additional Notes
          </label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Any other details about how you want your avatar to look..."
            rows={3}
            className="w-full bg-molt-bg border border-molt-border rounded-lg px-4 py-2.5
              text-molt-text placeholder:text-molt-muted/50
              focus:outline-none focus:border-molt-accent transition-colors resize-none"
          />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="p-4 bg-molt-error/10 border border-molt-error/30 rounded-lg text-molt-error text-sm">
          {error}
        </div>
      )}

      {/* Generate button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleGenerate}
          disabled={analyzing}
          className="btn-primary text-lg px-10 py-4"
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
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
              Analyzing & Generating...
            </span>
          ) : (
            "Generate Avatar ⚡"
          )}
        </button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-molt-muted">Loading...</div>
      }
    >
      <CreatePageContent />
    </Suspense>
  );
}
