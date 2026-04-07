/**
 * Photo analysis using Gemini Vision
 * Extracts IdentityBlock and BodyBlock from uploaded photos
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AnalysisRequest,
  AnalysisResult,
  IdentityBlock,
  BodyBlock,
} from "./types";
import { FACE_ANALYSIS_PROMPT, BODY_ANALYSIS_PROMPT } from "./prompts/index";

const MODEL = "gemini-2.5-flash";

function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Analyze face and body photos to extract character identity
 */
export async function analyzePhotos(
  apiKey: string,
  request: AnalysisRequest
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const faceImageParts = request.facePhotos.map((buf, i) =>
    bufferToGenerativePart(buf, request.mimeTypes[i] || "image/jpeg")
  );

  const faceResult = await model.generateContent([
    FACE_ANALYSIS_PROMPT,
    ...faceImageParts,
  ]);

  const faceText = faceResult.response.text();
  const identityBlock: IdentityBlock = JSON.parse(cleanJsonResponse(faceText));

  let bodyBlock: BodyBlock | null = null;

  if (request.bodyPhotos && request.bodyPhotos.length > 0) {
    const bodyOffset = request.facePhotos.length;
    const bodyImageParts = request.bodyPhotos.map((buf, i) =>
      bufferToGenerativePart(
        buf,
        request.mimeTypes[bodyOffset + i] || "image/jpeg"
      )
    );

    const bodyResult = await model.generateContent([
      BODY_ANALYSIS_PROMPT,
      ...bodyImageParts,
    ]);

    const bodyText = bodyResult.response.text();
    bodyBlock = JSON.parse(cleanJsonResponse(bodyText));
  }

  return { identityBlock, bodyBlock };
}
