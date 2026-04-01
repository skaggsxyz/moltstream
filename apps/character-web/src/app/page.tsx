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
    (
      files: FileList | File[],
      target: "face" | "body"
    ) => {
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
      target === "face"
        ? setDragActiveFace(false)
        : setDragActiveBody(false);
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
      router.push(`/create?id=${characterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const canProceed = facePhotos.length >= 3;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold">
          Create Your{" "}
          <span className="neon-text">Streamer Avatar</span>
        </h1>
        <p className="text-molt-muted text-lg max-w-2xl mx-auto">
          Upload photos of your face and AI will analyze your features to
          generate a unique, stylized avatar for streaming.
        </p>
      </div>

      {/* Face photos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Face Photos{" "}
              <span className="text-molt-accent">*</span>
            </h2>
            <p className="text-sm text-molt-muted">
              Upload 3-5 clear photos of your face (different angles work
              best)
            </p>
          </div>
          <span className="text-sm font-mono text-molt-muted">
            {facePhotos.length}/5
          </span>
        </div>

        <div
          className={`drop-zone ${dragActiveFace ? "active" : ""}`}
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
          <svg
            className="w-12 h-12 text-molt-muted"
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
          <p className="text-molt-muted">
            Drag & drop face photos here, or{" "}
            <span className="text-molt-accent">click to browse</span>
          </p>
          <p className="text-xs text-molt-muted">
            JPG, PNG, WebP — 3 required, 5 max
          </p>
        </div>

        {/* Preview grid */}
        {facePhotos.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {facePhotos.map((f, i) => (
              <div key={i} className="relative group">
                <img
                  src={f.preview}
                  alt={`Face ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-lg border border-molt-border"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile("face", i);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-molt-error text-white text-xs
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
            <h2 className="text-xl font-semibold">
              Body Photos{" "}
              <span className="text-molt-muted text-sm font-normal">
                (optional)
              </span>
            </h2>
            <p className="text-sm text-molt-muted">
              Full-body or torso photos help generate a more accurate avatar
            </p>
          </div>
          <span className="text-sm font-mono text-molt-muted">
            {bodyPhotos.length}/3
          </span>
        </div>

        <div
          className={`drop-zone ${dragActiveBody ? "active" : ""}`}
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
          <svg
            className="w-12 h-12 text-molt-muted"
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
          <p className="text-molt-muted">
            Drag & drop body photos here, or{" "}
            <span className="text-molt-accent">click to browse</span>
          </p>
          <p className="text-xs text-molt-muted">
            JPG, PNG, WebP — up to 3
          </p>
        </div>

        {bodyPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {bodyPhotos.map((f, i) => (
              <div key={i} className="relative group">
                <img
                  src={f.preview}
                  alt={`Body ${i + 1}`}
                  className="w-full aspect-[3/4] object-cover rounded-lg border border-molt-border"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile("body", i);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-molt-error text-white text-xs
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
        <div className="p-4 bg-molt-error/10 border border-molt-error/30 rounded-lg text-molt-error text-sm">
          {error}
        </div>
      )}

      {/* Upload button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleUpload}
          disabled={!canProceed || uploading}
          className="btn-primary text-lg px-10 py-4"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
              >
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
              Uploading...
            </span>
          ) : (
            `Upload & Continue →`
          )}
        </button>
      </div>

      {!canProceed && facePhotos.length > 0 && (
        <p className="text-center text-sm text-molt-warning">
          {3 - facePhotos.length} more face photo
          {3 - facePhotos.length !== 1 ? "s" : ""} needed
        </p>
      )}
    </div>
  );
}
