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

const STATUS_STEPS: { status: Status; label: string; emoji: string }[] = [
  { status: "analyzing", label: "Analyzing your photos...", emoji: "🔍" },
  { status: "analyzed", label: "Features extracted!", emoji: "✅" },
  { status: "generating", label: "Generating avatar...", emoji: "🎨" },
  { status: "completed", label: "Avatar ready!", emoji: "🎉" },
];

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("id");
  const [currentStatus, setCurrentStatus] = useState<Status>("analyzing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      router.push("/");
      return;
    }

    const supabase = createBrowserClient();

    // Poll for status changes + listen via Realtime
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
              router.push(`/result?id=${characterId}`);
            }, 1500);
          } else if (newStatus === "failed") {
            setError("Generation failed. Please try again.");
          }
        }
      )
      .subscribe();

    // Also poll periodically as fallback
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
          router.push(`/result?id=${characterId}`);
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
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card max-w-lg w-full text-center space-y-8">
        {/* Animated orb */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-molt-accent/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-molt-accent/30 animate-pulse-slow" />
            <div className="absolute inset-4 rounded-full bg-molt-accent/50 animate-glow flex items-center justify-center">
              <span className="text-3xl">
                {error
                  ? "❌"
                  : STATUS_STEPS[currentStepIndex]?.emoji || "⏳"}
              </span>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {error
              ? "Something Went Wrong"
              : STATUS_STEPS[currentStepIndex]?.label || "Processing..."}
          </h2>
          {!error && (
            <p className="text-molt-muted text-sm">
              This usually takes 30-60 seconds. Don&apos;t close this page.
            </p>
          )}
          {error && (
            <p className="text-molt-error text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Progress steps */}
        <div className="space-y-3">
          {STATUS_STEPS.map((step, i) => {
            const isActive = i === currentStepIndex;
            const isDone = i < currentStepIndex;
            const isPending = i > currentStepIndex;

            return (
              <div
                key={step.status}
                className={`flex items-center gap-3 text-sm ${
                  isActive
                    ? "text-molt-accent"
                    : isDone
                    ? "text-molt-success"
                    : "text-molt-muted/50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                    isActive
                      ? "border-molt-accent bg-molt-accent/20"
                      : isDone
                      ? "border-molt-success bg-molt-success/20"
                      : "border-molt-border"
                  }`}
                >
                  {isDone ? "✓" : isPending ? i + 1 : "●"}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <button
            onClick={() => router.push("/")}
            className="btn-secondary"
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-molt-muted">Loading...</div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
