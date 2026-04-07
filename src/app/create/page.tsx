"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface UploadedFile {
  file: File;
  preview: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [facePhotos, setFacePhotos] = useState<UploadedFile[]>([]);
  const [bodyPhotos, setBodyPhotos] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActiveFace, setDragActiveFace] = useState(false);
  const [dragActiveBody, setDragActiveBody] = useState(false);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[], target: "face" | "body") => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      const setter = target === "face" ? setFacePhotos : setBodyPhotos;
      const max = target === "face" ? 5 : 3;

      setter((prev) => {
        const remaining = max - prev.length;
        const toAdd = fileArray.slice(0, remaining);
        return [
          ...prev,
          ...toAdd.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
          })),
        ];
      });
    },
    []
  );

  const removeFile = (target: "face" | "body", index: number) => {
    const setter = target === "face" ? setFacePhotos : setBodyPhotos;
    setter((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, target: "face" | "body") => {
      e.preventDefault();
      if (target === "face") setDragActiveFace(false);
      else setDragActiveBody(false);
      addFiles(e.dataTransfer.files, target);
    },
    [addFiles]
  );

  const handleUpload = async () => {
    if (facePhotos.length < 3) {
      setError("Please upload at least 3 face photos");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      facePhotos.forEach((f) => formData.append("face", f.file));
      bodyPhotos.forEach((f) => formData.append("body", f.file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { characterId } = await res.json();
      router.push(`/create/style?id=${characterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const canProceed = facePhotos.length >= 3;

  return (
    <main className="min-h-screen bg-[#0B0F14] text-brutal-white">
      {/* Page header */}
      <div className="border-b border-brutal-red/30 px-6 md:px-10 py-8 relative">
        <span className="corner-label top-right">STEP_01 / UPLOAD</span>
        <p className="label-mono-red mb-3">{"// CHARACTER_CREATOR"}</p>
        <h1 className="headline-massive text-[8vw] md:text-[5vw] text-brutal-white">
          UPLOAD
          <br />
          <span className="headline-outlined">YOUR PHOTOS</span>
        </h1>
        <p className="body-text mt-4 max-w-2xl">
          Upload photos of your face and AI will analyze your features to
          generate a unique, stylized avatar for streaming.
        </p>
      </div>

      <div className="px-6 md:px-10 py-10 space-y-12">
        {/* Face photos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-grotesk font-bold text-xl text-brutal-white uppercase">
                  Face Photos
                </h2>
                <span className="text-brutal-red font-mono text-sm">*</span>
              </div>
              <p className="label-mono">
                Upload 3–5 clear photos — different angles work best
              </p>
            </div>
            <span className="font-mono text-brutal-white/40 text-sm">
              {facePhotos.length}/5
            </span>
          </div>

          {/* Drop zone */}
          <div
            className={`grid-cell cursor-pointer transition-colors ${
              dragActiveFace
                ? "bg-brutal-red/10 border-brutal-red/60"
                : "hover:bg-brutal-white/3"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveFace(true);
            }}
            onDragLeave={() => setDragActiveFace(false)}
            onDrop={(e) => handleDrop(e, "face")}
            onClick={() => faceInputRef.current?.click()}
          >
            <input
              ref={faceInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && addFiles(e.target.files, "face")
              }
            />
            <span className="corner-label-cyan">FACE_PHOTOS</span>
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <svg
                className="w-12 h-12 text-brutal-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 16v-8m0 0l-3 3m3-3l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-brutal-white/40 font-mono text-sm">
                Drag & drop face photos here, or{" "}
                <span className="text-brutal-red">click to browse</span>
              </p>
              <p className="label-mono">JPG, PNG, WebP — 3 required, 5 max</p>
            </div>
          </div>

          {/* Preview grid */}
          {facePhotos.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {facePhotos.map((f, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.preview}
                    alt={`Face ${i + 1}`}
                    className="w-full aspect-square object-cover border border-brutal-red/30"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile("face", i);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-brutal-red text-brutal-white text-xs
                      flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Body photos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-grotesk font-bold text-xl text-brutal-white uppercase">
                  Body Photos
                </h2>
                <span className="text-brutal-white/40 font-mono text-sm uppercase">
                  optional
                </span>
              </div>
              <p className="label-mono">
                Full-body or torso shots help generate a more accurate avatar
              </p>
            </div>
            <span className="font-mono text-brutal-white/40 text-sm">
              {bodyPhotos.length}/3
            </span>
          </div>

          <div
            className={`grid-cell cursor-pointer transition-colors ${
              dragActiveBody
                ? "bg-brutal-red/10 border-brutal-red/60"
                : "hover:bg-brutal-white/3"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveBody(true);
            }}
            onDragLeave={() => setDragActiveBody(false)}
            onDrop={(e) => handleDrop(e, "body")}
            onClick={() => bodyInputRef.current?.click()}
          >
            <input
              ref={bodyInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && addFiles(e.target.files, "body")
              }
            />
            <span className="corner-label-cyan">BODY_PHOTOS</span>
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <svg
                className="w-12 h-12 text-brutal-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p className="text-brutal-white/40 font-mono text-sm">
                Drag & drop body photos here, or{" "}
                <span className="text-brutal-red">click to browse</span>
              </p>
              <p className="label-mono">JPG, PNG, WebP — up to 3</p>
            </div>
          </div>

          {bodyPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {bodyPhotos.map((f, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.preview}
                    alt={`Body ${i + 1}`}
                    className="w-full aspect-[3/4] object-cover border border-brutal-red/30"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile("body", i);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-brutal-red text-brutal-white text-xs
                      flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="grid-cell border-red-500/50 bg-red-500/5">
            <p className="text-red-500 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Warning */}
        {!canProceed && facePhotos.length > 0 && (
          <p className="text-center font-mono text-sm text-yellow-500">
            {3 - facePhotos.length} more face photo
            {3 - facePhotos.length !== 1 ? "s" : ""} needed
          </p>
        )}

        {/* Upload button */}
        <div className="flex justify-center pt-4 pb-16">
          <button
            onClick={handleUpload}
            disabled={!canProceed || uploading}
            className={`github-rainbow font-mono text-sm uppercase tracking-[0.1em] text-brutal-white px-10 py-5 transition-all duration-200 ${
              !canProceed || uploading ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? (
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
                UPLOADING...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <span className="font-bold">UPLOAD & CONTINUE</span>
                <span className="text-brutal-white/50">→</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
