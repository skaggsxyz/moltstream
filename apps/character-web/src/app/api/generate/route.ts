import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateAvatar } from "@moltstream/character-creator";
import type { StyleConfig, IdentityBlock, BodyBlock } from "@moltstream/character-creator";

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

    // Fetch character data
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

    // Update status
    await supabase
      .from("characters")
      .update({
        status: "generating",
        style_config: styleConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    // Generate avatars
    const result = await generateAvatar(geminiKey, {
      characterId,
      identityBlock: character.identity_block as IdentityBlock,
      bodyBlock: (character.body_block as BodyBlock) || null,
      styleConfig,
    });

    // Upload turnaround sheet to storage
    const turnaroundBuffer = Buffer.from(
      result.turnaroundImageBase64,
      "base64"
    );
    const turnaroundExt = result.turnaroundMimeType.includes("png")
      ? "png"
      : "jpg";
    const turnaroundPath = `${characterId}/turnaround.${turnaroundExt}`;

    await supabase.storage
      .from("character-avatars")
      .upload(turnaroundPath, turnaroundBuffer, {
        contentType: result.turnaroundMimeType,
        upsert: true,
      });

    const {
      data: { publicUrl: turnaroundUrl },
    } = supabase.storage
      .from("character-avatars")
      .getPublicUrl(turnaroundPath);

    // Upload portrait to storage
    const portraitBuffer = Buffer.from(
      result.portraitImageBase64,
      "base64"
    );
    const portraitExt = result.portraitMimeType.includes("png")
      ? "png"
      : "jpg";
    const portraitPath = `${characterId}/portrait.${portraitExt}`;

    await supabase.storage
      .from("character-avatars")
      .upload(portraitPath, portraitBuffer, {
        contentType: result.portraitMimeType,
        upsert: true,
      });

    const {
      data: { publicUrl: portraitUrl },
    } = supabase.storage
      .from("character-avatars")
      .getPublicUrl(portraitPath);

    // Update character with results
    await supabase
      .from("characters")
      .update({
        status: "completed",
        turnaround_url: turnaroundUrl,
        portrait_url: portraitUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    return NextResponse.json({
      turnaroundUrl,
      portraitUrl,
    });
  } catch (err) {
    console.error("Generation error:", err);

    // Try to update status to failed
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
      {
        error:
          err instanceof Error ? err.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
