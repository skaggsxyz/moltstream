/**
 * Avatar generation using Gemini Imagen
 * Generates turnaround sheet and portrait from character data
 */

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import type { GenerationRequest, GenerationResult } from "./types";
import { buildTurnaroundPrompt, buildPortraitPrompt } from "./prompts/index";

const IMAGE_MODEL = "gemini-3-pro-image-preview";

function buildImageParts(
  request: GenerationRequest,
  prompt: string
): Part[] {
  const parts: Part[] = [];

  if (
    request.styleConfig.artStyle === "realistic" &&
    request.referencePhotos?.length
  ) {
    const refs = request.referencePhotos.slice(0, 3);
    for (const ref of refs) {
      parts.push({
        inlineData: {
          data: ref.base64,
          mimeType: ref.mimeType,
        },
      });
    }
    parts.push({
      text: `REFERENCE PHOTOS ABOVE: These are photos of the real person. The generated image must depict THIS EXACT PERSON — same face, same features, same likeness. Use these photos as the primary reference for the face.\n\n${prompt}`,
    });
  } else {
    parts.push({ text: prompt });
  }

  return parts;
}

/**
 * Generate avatar images (turnaround sheet + portrait) from character data
 */
export async function generateAvatar(
  apiKey: string,
  request: GenerationRequest
): Promise<GenerationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      // @ts-expect-error — responseModalities not yet in SDK types
      responseModalities: ["image", "text"],
    },
  });

  const turnaroundPrompt = buildTurnaroundPrompt(
    request.identityBlock,
    request.bodyBlock,
    request.styleConfig
  );

  const turnaroundParts = buildImageParts(request, turnaroundPrompt);
  const turnaroundResult = await model.generateContent(turnaroundParts);
  const turnaroundResponse = turnaroundResult.response;

  let turnaroundImageBase64 = "";
  let turnaroundMimeType = "image/png";

  for (const candidate of turnaroundResponse.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        turnaroundImageBase64 = part.inlineData.data;
        turnaroundMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }
    if (turnaroundImageBase64) break;
  }

  if (!turnaroundImageBase64) {
    throw new Error(
      "Failed to generate turnaround sheet — no image in response"
    );
  }

  // Build portrait
  const portraitPrompt = buildPortraitPrompt(
    request.identityBlock,
    request.styleConfig
  );

  // Note: portrait generation intentionally returns empty for now (same as original)
  void portraitPrompt;

  return {
    turnaroundImageBase64,
    portraitImageBase64: "",
    turnaroundMimeType,
    portraitMimeType: "",
  };
}
