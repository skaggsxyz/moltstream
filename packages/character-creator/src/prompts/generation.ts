/**
 * Prompt templates for avatar generation via Gemini Imagen
 */

import type { IdentityBlock, BodyBlock, StyleConfig } from "../types.js";

const STYLE_DESCRIPTORS: Record<string, string> = {
  anime:
    "anime art style, vibrant colors, clean linework, expressive features, Studio Ghibli meets modern anime aesthetic",
  realistic:
    "professional studio photograph, shot on Canon EOS R5 with 85mm f/1.4 lens, real human being, NOT illustration, NOT 3D render, NOT digital art — actual photo with real skin pores, real hair strands, natural skin imperfections, studio softbox lighting, fashion editorial quality, Vogue magazine photo shoot",
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
FACIAL FEATURES:
- Face shape: ${identity.faceShape}
- Nose: ${identity.nose.shape}, ${identity.nose.size} size, ${identity.nose.bridge} bridge
- Lips: ${identity.lips.shape}, ${identity.lips.size}
- Eyes: ${identity.eyes.shape}, ${identity.eyes.size}, ${identity.eyes.color}, ${identity.eyes.spacing} spacing
- Eyebrows: ${identity.eyebrows.shape}, ${identity.eyebrows.thickness}, ${identity.eyebrows.color}
- Skin: ${identity.skinTone.shade} with ${identity.skinTone.undertone} undertone
- Hair: ${identity.hair.color}, ${identity.hair.texture}, ${identity.hair.length}, styled as ${identity.hair.style}
${identity.distinguishingFeatures.length > 0 ? `- Distinguishing features: ${identity.distinguishingFeatures.join(", ")}` : ""}
- Overall vibe: ${identity.overallVibe}`.trim();
}

function buildBodyDescription(body: BodyBlock): string {
  return `
BODY CHARACTERISTICS:
- Build: ${body.build}
- Shoulders: ${body.proportions.shoulders}
- Torso: ${body.proportions.torso}
- Legs: ${body.proportions.legs}
- Height impression: ${body.estimatedHeight}
${body.tattoos.length > 0 ? `- Tattoos: ${body.tattoos.join(", ")}` : ""}
${body.distinguishingFeatures.length > 0 ? `- Notable features: ${body.distinguishingFeatures.join(", ")}` : ""}`.trim();
}

export function buildTurnaroundPrompt(
  identity: IdentityBlock,
  body: BodyBlock | null,
  style: StyleConfig
): string {
  const styleDesc =
    STYLE_DESCRIPTORS[style.artStyle] || STYLE_DESCRIPTORS.realistic;

  return `Create a professional AI influencer / virtual streamer CHARACTER REFERENCE SHEET — a single image with a clean pure white background (#FFFFFF), containing multiple views of the SAME character arranged in a structured layout:

LAYOUT (all on one image, white background):
- TOP LEFT: Large close-up head shot, front-facing, detailed face visible
- TOP RIGHT: Head shot from left profile (side view)
- BOTTOM LEFT: Full body front view, standing pose, feet visible
- BOTTOM RIGHT: Full body back view, standing pose, showing outfit from behind

Each view must show the EXACT same person with IDENTICAL features, hair, outfit, and accessories — just from different angles. Character must be CONSISTENT across all four panels.

ART STYLE: ${styleDesc}
${style.colorPalette ? `COLOR PALETTE: ${style.colorPalette} tones` : ""}
${style.mood ? `MOOD/ENERGY: ${style.mood}` : ""}

CHARACTER DESCRIPTION:
${buildIdentityDescription(identity)}
${body ? "\n" + buildBodyDescription(body) : ""}

OUTFIT: ${style.outfit || "Modern streetwear — clean hoodie or tech jacket, fitted pants, sneakers"}
ACCESSORIES: ${style.accessories?.join(", ") || "Minimal accessories"}
${style.customNotes ? `ADDITIONAL NOTES: ${style.customNotes}` : ""}

CRITICAL REQUIREMENTS:
- PURE WHITE background (#FFFFFF) — no gradients, no patterns, no environment
- Professional studio lighting — soft, even, no harsh shadows on background
- All four views show the SAME character with perfect consistency
- The face must preserve ALL described facial features exactly
- Clean separation between the four views
- High quality, sharp details, professional character sheet
- This is an AI influencer avatar — should look polished and appealing
- NO text, NO labels, NO watermarks on the image
${style.artStyle === "realistic" ? `
PHOTOREALISM REQUIREMENTS (CRITICAL):
- This must look like a REAL PHOTOGRAPH of a REAL PERSON — not an illustration, not a 3D render, not digital art
- Real skin with pores, subtle blemishes, natural texture — NOT smooth/plastic CGI skin
- Real hair with individual strands visible — NOT stylized/painted hair
- Natural eye reflections and catchlights as seen in real photography
- Clothing with real fabric texture, natural folds and creases
- Think: professional fashion/editorial photo shoot in a white studio
- The viewer should NOT be able to tell this is AI-generated` : ""}`;
}

export function buildPortraitPrompt(
  identity: IdentityBlock,
  style: StyleConfig
): string {
  const styleDesc =
    STYLE_DESCRIPTORS[style.artStyle] || STYLE_DESCRIPTORS.realistic;

  return `Create a stunning close-up portrait of an AI influencer / virtual streamer character — head and upper shoulders, facing slightly toward the camera with a confident, charismatic expression.

PURE WHITE background (#FFFFFF) — no gradients, no patterns, no environment. Professional studio lighting.

ART STYLE: ${styleDesc}
${style.colorPalette ? `COLOR PALETTE: ${style.colorPalette} tones` : ""}
${style.mood ? `MOOD/ENERGY: ${style.mood}` : ""}

CHARACTER DESCRIPTION:
${buildIdentityDescription(identity)}

OUTFIT (visible at shoulders): ${style.outfit || "Modern clean outfit"}
ACCESSORIES: ${style.accessories?.join(", ") || "Minimal"}
${style.customNotes ? `ADDITIONAL NOTES: ${style.customNotes}` : ""}

REQUIREMENTS:
- Close-up portrait, head and upper shoulders only
- PURE WHITE background (#FFFFFF)
- Professional studio lighting, soft and even
- Expressive eyes that convey personality and charisma
- High detail, 4K quality
- The portrait must clearly reflect ALL described facial features
- Polished AI influencer look — appealing and professional
- NO text, NO labels, NO watermarks
${style.artStyle === "realistic" ? `
PHOTOREALISM REQUIREMENTS (CRITICAL):
- This must look like a REAL PHOTOGRAPH — not illustration, not 3D render
- Real skin with pores and natural texture, NOT smooth CGI
- Real hair with individual strands, natural lighting on hair
- Professional fashion photography quality — think Vogue, GQ editorial
- The viewer should NOT be able to tell this is AI-generated` : ""}`;
}
