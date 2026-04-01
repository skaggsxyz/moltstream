/**
 * Prompt templates for avatar generation via Gemini Imagen
 */

import type { IdentityBlock, BodyBlock, StyleConfig } from "../types.js";

const STYLE_DESCRIPTORS: Record<string, string> = {
  anime:
    "anime art style, vibrant colors, clean linework, expressive features, Studio Ghibli meets modern anime aesthetic",
  realistic:
    "professional studio photograph of a real person, shot on Canon EOS R5 85mm f/1.4, NOT illustration, NOT drawing, NOT 3D render, NOT digital art, NOT painting — this must be indistinguishable from a real photograph of a real human being",
  pixel:
    "pixel art style, 32-bit era aesthetics, clean pixel work, retro gaming character design",
  cyberpunk:
    "cyberpunk aesthetic, neon accents on clothing and accessories, chrome details, futuristic tech wear",
  watercolor:
    "watercolor illustration style, soft washes, flowing colors, artistic and painterly, visible brushstrokes",
  comic:
    "comic book art style, bold outlines, dynamic shading, Marvel/DC quality character design",
  "3d-render":
    "3D rendered character, Pixar/Disney quality, smooth shading, appealing proportions, professional character design",
  fantasy:
    "fantasy art style, magical atmosphere, ethereal lighting, detailed armor/clothing, Dungeons & Dragons character art",
};

function buildIdentityDescription(identity: IdentityBlock): string {
  return `
- Face shape: ${identity.faceShape}
- Nose: ${identity.nose.shape}, ${identity.nose.size}, ${identity.nose.bridge} bridge
- Lips: ${identity.lips.shape}, ${identity.lips.size}
- Eyes: ${identity.eyes.shape}, ${identity.eyes.size}, ${identity.eyes.color}, ${identity.eyes.spacing} spacing
- Eyebrows: ${identity.eyebrows.shape}, ${identity.eyebrows.thickness}, ${identity.eyebrows.color}
- Skin: ${identity.skinTone.shade} with ${identity.skinTone.undertone} undertone
- Hair: ${identity.hair.color}, ${identity.hair.texture}, ${identity.hair.length}, ${identity.hair.style}
${identity.distinguishingFeatures.length > 0 ? `- Distinguishing features: ${identity.distinguishingFeatures.join(", ")}` : ""}`.trim();
}

function buildBodyDescription(body: BodyBlock): string {
  return `
- Build: ${body.build}
- Shoulders: ${body.proportions.shoulders}, Torso: ${body.proportions.torso}, Legs: ${body.proportions.legs}
- Height: ${body.estimatedHeight}
${body.tattoos.length > 0 ? `- Tattoos: ${body.tattoos.join(", ")}` : ""}
${body.distinguishingFeatures.length > 0 ? `- Features: ${body.distinguishingFeatures.join(", ")}` : ""}`.trim();
}

function isRealistic(style: StyleConfig): boolean {
  return style.artStyle === "realistic";
}

export function buildTurnaroundPrompt(
  identity: IdentityBlock,
  body: BodyBlock | null,
  style: StyleConfig
): string {
  const styleDesc =
    STYLE_DESCRIPTORS[style.artStyle] || STYLE_DESCRIPTORS.realistic;

  if (isRealistic(style)) {
    // Photorealistic path — completely different prompt structure
    return `Create a professional MODEL AGENCY COMPOSITE CARD / CHARACTER REFERENCE SHEET.

This is a REAL PHOTOGRAPH of a REAL PERSON taken during a professional photo shoot in a white studio. 
This is NOT art. This is NOT an illustration. This is NOT a render. This is a PHOTOGRAPH.

LAYOUT — single image, pure white studio background:
- TOP LEFT: Head shot, front-facing, shoulders up. Like a professional headshot/casting photo.
- TOP RIGHT: Head shot, left profile (side view). Same person, same lighting.
- BOTTOM LEFT: Full body, front view, standing naturally. Like a model agency card.
- BOTTOM RIGHT: Full body, back view, same pose from behind.

THE PERSON:
${buildIdentityDescription(identity)}
${body ? "\n" + buildBodyDescription(body) : ""}

CLOTHING: ${style.outfit || "Black fitted jacket, dark pants, clean white sneakers"}
ACCESSORIES: ${style.accessories?.join(", ") || "Minimal — small jewelry"}
${style.customNotes ? `NOTES: ${style.customNotes}` : ""}

PHOTOGRAPHIC REQUIREMENTS:
- Shot in a white cyclorama studio with professional softbox lighting
- Real human skin — visible pores, natural color variation, micro-wrinkles, no airbrushing
- Real hair — individual strands, natural flyaways, not stylized
- Real eyes — natural catchlights, visible iris detail, slight redness in sclera  
- Real clothing — fabric texture, natural creases, proper draping on body
- Consistent person across all 4 views — IDENTICAL face, hair, build, outfit
- Color temperature: neutral/slightly warm (5600K studio lights)
- This should be indistinguishable from a real photo if shown to someone
- NO text, NO labels, NO watermarks, NO borders between panels`;
  }

  // Non-realistic (stylized) path
  return `Create a CHARACTER REFERENCE SHEET — a single image with a clean pure white background, containing multiple views of the SAME character:

LAYOUT (all on one image, white background):
- TOP LEFT: Large close-up head shot, front-facing
- TOP RIGHT: Head shot from left profile (side view)
- BOTTOM LEFT: Full body front view, standing pose
- BOTTOM RIGHT: Full body back view, standing pose

ART STYLE: ${styleDesc}
${style.colorPalette ? `COLOR PALETTE: ${style.colorPalette}` : ""}
${style.mood ? `MOOD: ${style.mood}` : ""}

CHARACTER:
${buildIdentityDescription(identity)}
${body ? "\n" + buildBodyDescription(body) : ""}

OUTFIT: ${style.outfit || "Modern streetwear — clean hoodie or jacket, fitted pants, sneakers"}
ACCESSORIES: ${style.accessories?.join(", ") || "Minimal"}
${style.customNotes ? `NOTES: ${style.customNotes}` : ""}

REQUIREMENTS:
- Pure white background
- All four views show the SAME character with perfect consistency
- Clean separation between views
- High quality, polished design
- NO text, NO labels, NO watermarks`;
}

export function buildPortraitPrompt(
  identity: IdentityBlock,
  style: StyleConfig
): string {
  const styleDesc =
    STYLE_DESCRIPTORS[style.artStyle] || STYLE_DESCRIPTORS.realistic;

  if (isRealistic(style)) {
    return `Professional headshot photograph of a real person. White studio background. Shot on Canon EOS R5 with 85mm f/1.4 lens. Soft studio lighting.

This is a REAL PHOTOGRAPH, NOT an illustration, NOT a render, NOT digital art.

THE PERSON:
${buildIdentityDescription(identity)}

Wearing: ${style.outfit || "Clean modern outfit"}
${style.accessories?.length ? `Accessories: ${style.accessories.join(", ")}` : ""}

PHOTO REQUIREMENTS:
- Head and upper shoulders, facing camera with slight angle
- Real skin with pores, natural texture, subtle imperfections
- Real hair with individual strands and natural shine  
- Natural eye detail — iris patterns, catchlights, depth
- Professional studio lighting — main light with fill, white background
- Sharp focus on eyes, natural shallow depth of field
- This must look like a casting headshot or magazine editorial photo
- Absolutely indistinguishable from a real photograph
- NO text, NO watermarks`;
  }

  return `Close-up portrait of a character — head and upper shoulders, facing slightly toward camera.

ART STYLE: ${styleDesc}
${style.colorPalette ? `COLOR PALETTE: ${style.colorPalette}` : ""}
${style.mood ? `MOOD: ${style.mood}` : ""}

CHARACTER:
${buildIdentityDescription(identity)}

OUTFIT (shoulders): ${style.outfit || "Modern clean outfit"}
${style.accessories?.length ? `ACCESSORIES: ${style.accessories.join(", ")}` : ""}

REQUIREMENTS:
- Close-up, head and shoulders
- Pure white background
- Expressive, high quality
- NO text, NO watermarks`;
}
