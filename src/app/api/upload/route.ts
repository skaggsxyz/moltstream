import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Preset mode — no photos needed
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const supabase = createServerClient();
      const { data: character, error: charError } = await supabase
        .from("characters")
        .insert({ status: "pending", metadata: { preset: body.preset, presetNotes: body.presetNotes } })
        .select("id")
        .single();
      if (charError || !character) {
        return NextResponse.json({ error: "Failed to create character" }, { status: 500 });
      }
      return NextResponse.json({ characterId: character.id });
    }

    const formData = await request.formData();
    const faceFiles = formData.getAll("face") as File[];
    const bodyFiles = formData.getAll("body") as File[];

    if (faceFiles.length < 1) {
      return NextResponse.json(
        { error: "Upload at least 1 face photo" },
        { status: 400 }
      );
    }
    if (faceFiles.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 face photos allowed" },
        { status: 400 }
      );
    }
    if (bodyFiles.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 body photos allowed" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: character, error: charError } = await supabase
      .from("characters")
      .insert({ status: "pending", metadata: {} })
      .select("id")
      .single();

    if (charError || !character) {
      console.error("Failed to create character:", charError);
      return NextResponse.json(
        { error: "Failed to create character" },
        { status: 500 }
      );
    }

    const characterId = character.id;

    for (let i = 0; i < faceFiles.length; i++) {
      const file = faceFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${characterId}/face_${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("character-photos")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Face upload error:", uploadError);
        continue;
      }

      await supabase.from("character_photos").insert({
        character_id: characterId,
        type: "face",
        storage_path: storagePath,
      });
    }

    for (let i = 0; i < bodyFiles.length; i++) {
      const file = bodyFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `${characterId}/body_${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("character-photos")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Body upload error:", uploadError);
        continue;
      }

      await supabase.from("character_photos").insert({
        character_id: characterId,
        type: "body",
        storage_path: storagePath,
      });
    }

    return NextResponse.json({ characterId });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
