import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { analyzePhotos } from "@/lib/character-creator";

export async function POST(request: NextRequest) {
  try {
    const { characterId } = await request.json();

    if (!characterId) {
      return NextResponse.json(
        { error: "characterId is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    await supabase
      .from("characters")
      .update({ status: "analyzing" })
      .eq("id", characterId);

    const { data: photos } = await supabase
      .from("character_photos")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at");

    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { error: "No photos found" },
        { status: 404 }
      );
    }

    const facePhotos = photos.filter((p) => p.type === "face");
    const bodyPhotos = photos.filter((p) => p.type === "body");

    const faceBuffers: Buffer[] = [];
    const bodyBuffers: Buffer[] = [];
    const mimeTypes: string[] = [];

    for (const photo of facePhotos) {
      const { data } = await supabase.storage
        .from("character-photos")
        .download(photo.storage_path);

      if (data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        faceBuffers.push(buffer);
        const ext = photo.storage_path.split(".").pop()?.toLowerCase();
        mimeTypes.push(
          ext === "png"
            ? "image/png"
            : ext === "webp"
            ? "image/webp"
            : "image/jpeg"
        );
      }
    }

    for (const photo of bodyPhotos) {
      const { data } = await supabase.storage
        .from("character-photos")
        .download(photo.storage_path);

      if (data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        bodyBuffers.push(buffer);
        const ext = photo.storage_path.split(".").pop()?.toLowerCase();
        mimeTypes.push(
          ext === "png"
            ? "image/png"
            : ext === "webp"
            ? "image/webp"
            : "image/jpeg"
        );
      }
    }

    const result = await analyzePhotos(geminiKey, {
      facePhotos: faceBuffers,
      bodyPhotos: bodyBuffers.length > 0 ? bodyBuffers : undefined,
      mimeTypes,
    });

    await supabase
      .from("characters")
      .update({
        status: "analyzed",
        identity_block: result.identityBlock,
        body_block: result.bodyBlock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    return NextResponse.json({
      identityBlock: result.identityBlock,
      bodyBlock: result.bodyBlock,
    });
  } catch (err) {
    console.error("Analysis error:", err);

    try {
      const { characterId } = await request.clone().json();
      if (characterId) {
        const supabase = createServerClient();
        await supabase
          .from("characters")
          .update({ status: "failed" })
          .eq("id", characterId);
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
