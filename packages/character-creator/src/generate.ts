/**
 * Avatar generation using Gemini Imagen
 * Generates turnaround sheet and portrait from character data
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  GenerationRequest,
  GenerationResult,
} from "./types.js";
import { buildTurnaroundPrompt, buildPortraitPrompt } from "./prompts/index.js";

const IMAGEN_MODEL = "gemini-2.0-flash-exp-image-generation";

/**
 * Generate avatar images (turnaround sheet + portrait) from character data
 */
export async function generateAvatar(
  apiKey: string,
  request: GenerationRequest
): Promise<GenerationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: IMAGEN_MODEL,
    generationConfig: {
      // @ts-expect-error — responseModalities not yet in SDK types
      responseModalities: ["image", "text"],
    },
  });

  // --- Generate turnaround sheet (16:9) ---
  const turnaroundPrompt = buildTurnaroundPrompt(
    request.identityBlock,
    request.bodyBlock,
    request.styleConfig
  );

  const turnaroundResult = await model.generateContent(turnaroundPrompt);
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

  // --- Generate portrait (3:4) ---
  const portraitPrompt = buildPortraitPrompt(
    request.identityBlock,
    request.styleConfig
  );

  const portraitResult = await model.generateContent(portraitPrompt);
  const portraitResponse = portraitResult.response;

  let portraitImageBase64 = "";
  let portraitMimeType = "image/png";

  for (const candidate of portraitResponse.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        portraitImageBase64 = part.inlineData.data;
        portraitMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }
    if (portraitImageBase64) break;
  }

  if (!portraitImageBase64) {
    throw new Error("Failed to generate portrait — no image in response");
  }

  return {
    turnaroundImageBase64,
    portraitImageBase64,
    turnaroundMimeType,
    portraitMimeType,
  };
}
