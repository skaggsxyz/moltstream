import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateAvatar } from "@/lib/character-creator";
import type { StyleConfig, IdentityBlock, BodyBlock } from "@/lib/character-creator";

export async function POST(request: NextRequest) {
  try {
    const { characterId, styleConfig } = (await request.json()) as {
      characterId: string;
      styleConfig: StyleConfig;
    };

    if (!characterId || !styleConfig) {
      return NextResponse.json(
        { error: "characterId and styleConfig are required" },
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

    const { data: character, error: fetchError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (fetchError || !character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    if (!character.identity_block) {
      return NextResponse.json(
        { error: "Character has not been analyzed yet" },
        { status: 400 }
      );
    }

    await supabase
      .from("characters")
      .update({
        status: "generating",
        style_config: styleConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    let referencePhotos: Array<{ base64: string; mimeType: string }> | undefined;

    if (styleConfig.artStyle === "realistic") {
      const { data: photos } = await supabase
        .from("character_photos")
        .select("storage_path, type")
        .eq("character_id", characterId)
        .eq("type", "face")
        .limit(3);

      if (photos && photos.length > 0) {
        referencePhotos = [];
        for (const photo of photos) {
          const { data: fileData } = await supabase.storage
            .from("character-photos")
            .download(photo.storage_path);

          if (fileData) {
            const buffer = Buffer.from(await fileData.arrayBuffer());
            referencePhotos.push({
              base64: buffer.toString("base64"),
              mimeType: "image/jpeg",
            });
          }
        }
      }
    }

    const result = await generateAvatar(geminiKey, {
      characterId,
      identityBlock: character.identity_block as IdentityBlock,
      bodyBlock: (character.body_block as BodyBlock) || null,
      styleConfig,
      referencePhotos,
    });

    const turnaroundBuffer = Buffer.from(result.turnaroundImageBase64, "base64");
    const turnaroundExt = result.turnaroundMimeType.includes("png") ? "png" : "jpg";
    const turnaroundPath = `${characterId}/turnaround.${turnaroundExt}`;

    await supabase.storage
      .from("character-avatars")
      .upload(turnaroundPath, turnaroundBuffer, {
        contentType: result.turnaroundMimeType,
        upsert: true,
      });

    const {
      data: { publicUrl: turnaroundUrl },
    } = supabase.storage.from("character-avatars").getPublicUrl(turnaroundPath);

    let portraitUrl = "";

    if (result.portraitImageBase64) {
      const portraitBuffer = Buffer.from(result.portraitImageBase64, "base64");
      const portraitExt = result.portraitMimeType.includes("png") ? "png" : "jpg";
      const portraitPath = `${characterId}/portrait.${portraitExt}`;

      await supabase.storage
        .from("character-avatars")
        .upload(portraitPath, portraitBuffer, {
          contentType: result.portraitMimeType,
          upsert: true,
        });

      const {
        data: { publicUrl },
      } = supabase.storage.from("character-avatars").getPublicUrl(portraitPath);
      portraitUrl = publicUrl;
    }

    await supabase
      .from("characters")
      .update({
        status: "completed",
        turnaround_url: turnaroundUrl,
        portrait_url: portraitUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    return NextResponse.json({ turnaroundUrl, portraitUrl });
  } catch (err) {
    console.error("Generation error:", err);

    try {
      const body = await request.clone().json();
      if (body.characterId) {
        const supabase = createServerClient();
        await supabase
          .from("characters")
          .update({ status: "failed" })
          .eq("id", body.characterId);
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
