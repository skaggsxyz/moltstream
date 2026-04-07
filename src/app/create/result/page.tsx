"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

interface CharacterData {
  id: string;
  turnaround_url: string | null;
  portrait_url: string | null;
  identity_block: Record<string, unknown> | null;
  style_config: Record<string, unknown> | null;
}

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("id");
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId) {
      router.push("/create");
      return;
    }

    const fetchCharacter = async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .single();

      if (error || !data) {
        router.push("/create");
        return;
      }

      setCharacter(data);
      setLoading(false);
    };

    fetchCharacter();
  }, [characterId, router]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      console.error("Download failed");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <p className="label-mono animate-pulse">LOADING YOUR AVATAR...</p>
      </main>
    );
  }

  if (!character) return null;

  return (
    <main className="min-h-screen bg-[#0B0F14] text-brutal-white">
      {/* Header */}
      <div className="border-b border-brutal-red/30 px-6 md:px-10 py-8 relative">
        <span className="corner-label top-right">COMPLETE</span>
        <p className="label-mono-red mb-3">{"// CHARACTER_CREATOR"}</p>
        <h1 className="headline-massive text-[8vw] md:text-[5vw] text-brutal-white">
          YOUR AVATAR
          <br />
          <span className="text-brutal-red">IS READY</span>
        </h1>
        <p className="body-text mt-4">
          Download your turnaround sheet and portrait below.
        </p>
      </div>

      <div className="px-6 md:px-10 py-10 space-y-10">
        {/* Turnaround sheet */}
        {character.turnaround_url && (
          <section>
            <div className="grid-cell">
              <span className="corner-label-cyan">TURNAROUND_SHEET</span>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-grotesk font-bold text-lg uppercase text-brutal-white">
                  Turnaround Sheet
                </h2>
                <button
                  onClick={() =>
                    handleDownload(
                      character.turnaround_url!,
                      `avatar-turnaround-${character.id}.png`
                    )
                  }
                  className="border border-brutal-white/20 font-mono uppercase text-xs tracking-widest px-6 py-3 hover:border-brutal-red/60 transition-colors"
                >
                  ↓ Download
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={character.turnaround_url}
                alt="Character turnaround sheet"
                className="w-full border border-brutal-red/20"
              />
            </div>
          </section>
        )}

        {/* Portrait */}
        {character.portrait_url && (
          <section>
            <div className="grid-cell">
              <span className="corner-label-cyan">PORTRAIT</span>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-grotesk font-bold text-lg uppercase text-brutal-white">
                  Portrait
                </h2>
                <button
                  onClick={() =>
                    handleDownload(
                      character.portrait_url!,
                      `avatar-portrait-${character.id}.png`
                    )
                  }
                  className="border border-brutal-white/20 font-mono uppercase text-xs tracking-widest px-6 py-3 hover:border-brutal-red/60 transition-colors"
                >
                  ↓ Download
                </button>
              </div>
              <div className="max-w-md mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={character.portrait_url}
                  alt="Character portrait"
                  className="w-full border border-brutal-red/20"
                />
              </div>
            </div>
          </section>
        )}

        {/* Identity summary */}
        {character.identity_block && (
          <section>
            <div className="grid-cell">
              <span className="corner-label-cyan">IDENTITY_BLOCK</span>
              <h2 className="font-grotesk font-bold text-lg uppercase text-brutal-white mb-6">
                Analyzed Features
              </h2>
              <pre className="text-xs text-brutal-white/40 font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(character.identity_block, null, 2)}
              </pre>
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 pt-4 pb-16">
          <button
            onClick={() => router.push("/create")}
            className="github-rainbow font-mono text-sm uppercase tracking-[0.1em] text-brutal-white px-10 py-5"
          >
            <span className="font-bold">CREATE ANOTHER AVATAR</span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="border border-brutal-white/20 font-mono uppercase text-sm tracking-widest px-8 py-5 hover:border-brutal-white/40 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
          <p className="label-mono">LOADING...</p>
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
