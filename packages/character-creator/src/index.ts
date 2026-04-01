export type {
  IdentityBlock,
  BodyBlock,
  StyleConfig,
  ArtStyle,
  Character,
  CharacterStatus,
  GenerationRequest,
  GenerationResult,
  AnalysisRequest,
  AnalysisResult,
} from "./types.js";

export { analyzePhotos } from "./analyze.js";
export { generateAvatar } from "./generate.js";
export {
  FACE_ANALYSIS_PROMPT,
  BODY_ANALYSIS_PROMPT,
  buildTurnaroundPrompt,
  buildPortraitPrompt,
} from "./prompts/index.js";
