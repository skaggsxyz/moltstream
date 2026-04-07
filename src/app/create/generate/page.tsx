"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

type Status =
  | "pending"
  | "analyzing"
  | "analyzed"
  | "generating"
  | "completed"
  | "failed";

const STATUS_STEPS: { status: Status; label: string; code: string }[] = [
  { status: "analyzing", label: "Analyzing your photos...", code: "PHASE_01" },
  { status: "analyzed", label: "Features extracted!", code: "PHASE_02" },
  { status: "generating", label: "Generating avatar...", code: "PHASE_03" },
  { status: "completed", label: "Avatar ready!", code: "PHASE_04" },
];

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("id");
  const [currentStatus, setCurrentStatus] = useState<Status>("analyzing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      router.push("/create");
      return;
    }

    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`character-${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "characters",
          filter: `id=eq.${characterId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as Status;
          setCurrentStatus(newStatus);

          if (newStatus === "completed") {
            setTimeout(() => {
              router.push(`/create/result?id=${characterId}`);
            }, 1500);
          } else if (newStatus === "failed") {
            setError("Generation failed. Please try again.");
          }
        }
      )
      .subscribe();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("characters")
        .select("status")
        .eq("id", characterId)
        .single();

      if (data) {
        setCurrentStatus(data.status as Status);
        if (data.status === "completed") {
          clearInterval(interval);
          router.push(`/create/result?id=${characterId}`);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError("Generation failed. Please try again.");
        }
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [characterId, router]);

  if (!characterId) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.status === currentStatus
  );

  return (
    <main className="min-h-screen bg-[#0B0F14] text-brutal-white flex flex-col">
      {/* Header */}
      <div className="border-b border-brutal-red/30 px-6 md:px-10 py-8 relative">
        <span className="corner-label top-right">STEP_04 / GENERATE</span>
        <p className="label-mono-red mb-3">{"// CHARACTER_CREATOR"}</p>
        <h1 className="headline-massive text-[8vw] md:text-[5vw]">
          {error ? (
            <span className="text-red-500">ERROR</span>
          ) : (
            <span className="text-brutal-white">GENERATING</span>
          )}
          <br />
          <span className="headline-outlined">YOUR AVATAR</span>
        </h1>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-16">
        <div className="grid-cell max-w-xl w-full">
          <span className="corner-label-cyan">STATUS_MONITOR</span>

          {/* Animated indicator */}
          <div className="flex justify-center mb-10">
            <div className="relative w-20 h-20">
              {!error && (
                <>
                  <div className="absolute inset-0 border border-brutal-red/40 animate-ping" />
                  <div className="absolute inset-2 border border-brutal-red/60 animate-pulse" />
                </>
              )}
              <div className="absolute inset-4 bg-brutal-red/20 border border-brutal-red flex items-center justify-center">
                <span className="text-2xl">
                  {error ? "✕" : currentStatus === "completed" ? "✓" : "⚡"}
                </span>
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="text-center mb-10">
            <h2 className="font-grotesk font-bold text-2xl uppercase mb-2">
              {error
                ? "Something Went Wrong"
                : STATUS_STEPS[currentStepIndex]?.label || "Processing..."}
            </h2>
            {!error && (
              <p className="body-text text-sm">
                This usually takes 30–60 seconds. Don&apos;t close this page.
              </p>
            )}
            {error && (
              <p className="text-red-500 font-mono text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Progress steps */}
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              const isPending = i > currentStepIndex;

              return (
                <div
                  key={step.status}
                  className={`flex items-center gap-4 p-4 border-b border-brutal-red/10 font-mono text-sm ${
                    isActive
                      ? "text-[#00FFFF]"
                      : isDone
                      ? "text-green-500"
                      : "text-brutal-white/20"
                  }`}
                >
                  <span className="text-xs w-16">{step.code}</span>
                  <div
                    className={`w-5 h-5 border flex items-center justify-center text-xs flex-shrink-0 ${
                      isActive
                        ? "border-[#00FFFF] bg-[#00FFFF]/10"
                        : isDone
                        ? "border-green-500 bg-green-500/10"
                        : "border-brutal-white/20"
                    }`}
                  >
                    {isDone ? "✓" : isPending ? "" : "●"}
                  </div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.push("/create")}
                className="border border-brutal-white/20 font-mono uppercase text-sm tracking-widest px-8 py-4 hover:border-brutal-white/40 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
          <p className="label-mono">LOADING...</p>
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
