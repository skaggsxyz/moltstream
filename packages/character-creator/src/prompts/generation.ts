/**
 * Prompt templates for avatar generation via Gemini Imagen
 */

import type { IdentityBlock, BodyBlock, StyleConfig } from "../types.js";

const STYLE_DESCRIPTORS: Record<string, string> = {
  anime:
    "anime art style, vibrant colors, clean linework, expressive features, Studio Ghibli meets modern anime aesthetic",
  realistic:
    "photorealistic digital art, highly detailed, cinematic lighting, professional concept art quality",
  pixel:
    "pixel art style, 32-bit era aesthetics, clean pixel work, retro gaming character design",
  cyberpunk:
    "cyberpunk aesthetic, neon-lit, chrome accents, futuristic tech wear, Blade Runner meets Ghost in the Shell",
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
    STYLE_DESCRIPTORS[style.artStyle] || STYLE_DESCRIPTORS.anime;

  return `Create a professional character turnaround sheet showing THREE views of the same character: front view, three-quarter view, and profile (side) view. All three poses on a single image, evenly spaced, on a clean neutral background.

ART STYLE: ${styleDesc}
${style.colorPalette ? `COLOR PALETTE: ${style.colorPalette} tones` : ""}
${style.mood ? `MOOD/ENERGY: ${style.mood}` : ""}

CHARACTER DESCRIPTION:
${buildIdentityDescription(identity)}
${body ? "\n" + buildBodyDescription(body) : ""}

OUTFIT: ${style.outfit || "Casual modern streamer outfit — hoodie, comfortable fit"}
ACCESSORIES: ${style.accessories?.join(", ") || "Gaming headset around neck"}
${style.customNotes ? `ADDITIONAL NOTES: ${style.customNotes}` : ""}

REQUIREMENTS:
- Single image with all three views side by side
- Consistent character design across all views
- Full body visible in all three poses
- Character should look like a streaming/content creator avatar
- High quality, clean design suitable for use as a virtual streamer avatar
- The character must clearly reflect the described facial features and body type`;
}

export function buildPortraitPrompt(
  identity: IdentityBlock,
  style: StyleConfig
): string {
  const styleDesc =
    STYLE_DESCRIPTORS[style.artStyle] || STYLE_DESCRIPTORS.anime;

  return `Create a stunning close-up portrait of a character — head and upper shoulders, facing slightly toward the camera with a confident expression. This is a streamer avatar portrait.

ART STYLE: ${styleDesc}
${style.colorPalette ? `COLOR PALETTE: ${style.colorPalette} tones` : ""}
${style.mood ? `MOOD/ENERGY: ${style.mood}` : ""}

CHARACTER DESCRIPTION:
${buildIdentityDescription(identity)}

OUTFIT (visible at shoulders): ${style.outfit || "Casual modern streamer outfit"}
ACCESSORIES: ${style.accessories?.join(", ") || "Gaming headset around neck"}
${style.customNotes ? `ADDITIONAL NOTES: ${style.customNotes}` : ""}

REQUIREMENTS:
- Close-up portrait, head and upper shoulders
- Dramatic, professional lighting
- Expressive eyes that convey personality
- High detail, 4K quality
- Background: ${style.background || "subtle gradient or atmospheric bokeh"}
- The portrait must clearly reflect the described facial features
- Suitable as a profile picture / streaming avatar`;
}
