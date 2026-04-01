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
      router.push("/");
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
        router.push("/");
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-molt-muted animate-pulse">
          Loading your avatar...
        </div>
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          Your <span className="neon-text">Avatar</span> is Ready! 🎉
        </h1>
        <p className="text-molt-muted">
          Download your turnaround sheet and portrait below
        </p>
      </div>

      {/* Turnaround sheet */}
      {character.turnaround_url && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Turnaround Sheet</h2>
            <button
              onClick={() =>
                handleDownload(
                  character.turnaround_url!,
                  `avatar-turnaround-${character.id}.png`
                )
              }
              className="btn-secondary text-sm px-4 py-2"
            >
              ↓ Download
            </button>
          </div>
          <div className="card p-2">
            <img
              src={character.turnaround_url}
              alt="Character turnaround sheet"
              className="w-full rounded-lg"
            />
          </div>
        </section>
      )}

      {/* Portrait */}
      {character.portrait_url && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Portrait</h2>
            <button
              onClick={() =>
                handleDownload(
                  character.portrait_url!,
                  `avatar-portrait-${character.id}.png`
                )
              }
              className="btn-secondary text-sm px-4 py-2"
            >
              ↓ Download
            </button>
          </div>
          <div className="card p-2 max-w-md mx-auto">
            <img
              src={character.portrait_url}
              alt="Character portrait"
              className="w-full rounded-lg"
            />
          </div>
        </section>
      )}

      {/* Identity summary */}
      {character.identity_block && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Analyzed Features</h2>
          <div className="card">
            <pre className="text-xs text-molt-muted font-mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(character.identity_block, null, 2)}
            </pre>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <button onClick={() => router.push("/")} className="btn-primary">
          Create Another Avatar
        </button>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-molt-muted">Loading...</div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
