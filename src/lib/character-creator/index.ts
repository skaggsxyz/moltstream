// Re-export everything with local paths (no workspace:* references)
export type {
  IdentityBlock,
  BodyBlock,
  ArtStyle,
  StyleConfig,
  CharacterStatus,
  Character,
  GenerationRequest,
  GenerationResult,
  AnalysisRequest,
  AnalysisResult,
} from "./types";

export { analyzePhotos } from "./analyze";
export { generateAvatar } from "./generate";
export {
  FACE_ANALYSIS_PROMPT,
  BODY_ANALYSIS_PROMPT,
  buildTurnaroundPrompt,
  buildPortraitPrompt,
} from "./prompts/index";
