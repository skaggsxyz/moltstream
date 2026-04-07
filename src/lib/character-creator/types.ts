/**
 * Character Creator Types
 * Defines the data structures for AI-analyzed identity and body blocks,
 * plus character and generation metadata.
 */

// ─── Identity Block (from face photos) ───

export interface IdentityBlock {
  faceShape: string; // e.g. "oval", "round", "square", "heart", "oblong"
  nose: {
    shape: string; // e.g. "straight", "button", "aquiline", "snub"
    size: string; // "small" | "medium" | "large"
    bridge: string; // "narrow" | "medium" | "wide"
  };
  lips: {
    shape: string; // e.g. "full", "thin", "bow-shaped", "wide"
    size: string; // "small" | "medium" | "full"
  };
  eyes: {
    shape: string; // e.g. "almond", "round", "hooded", "monolid", "downturned"
    size: string; // "small" | "medium" | "large"
    color: string; // e.g. "brown", "blue", "green", "hazel"
    spacing: string; // "close-set" | "average" | "wide-set"
  };
  eyebrows: {
    shape: string; // e.g. "arched", "straight", "curved", "angled"
    thickness: string; // "thin" | "medium" | "thick"
    color: string;
  };
  skinTone: {
    shade: string; // e.g. "fair", "light", "medium", "olive", "tan", "brown", "dark"
    undertone: string; // "warm" | "cool" | "neutral"
  };
  hair: {
    color: string;
    texture: string; // "straight", "wavy", "curly", "coily"
    length: string; // "bald", "buzzcut", "short", "medium", "long", "very long"
    style: string; // description of current style
  };
  distinguishingFeatures: string[]; // moles, scars, dimples, freckles, piercings, etc.
  overallVibe: string; // AI's short summary of the person's visual identity
}

// ─── Body Block (from body photos, optional) ───

export interface BodyBlock {
  build: string; // "slim", "athletic", "average", "muscular", "stocky", "plus-size"
  proportions: {
    shoulders: string; // "narrow" | "average" | "broad"
    torso: string; // "short" | "average" | "long"
    legs: string; // "short" | "average" | "long"
  };
  estimatedHeight: string; // "short", "below-average", "average", "above-average", "tall"
  tattoos: string[]; // visible tattoo descriptions
  distinguishingFeatures: string[]; // posture notes, accessories, etc.
}

// ─── Style Configuration ───

export type ArtStyle =
  | "anime"
  | "realistic"
  | "pixel"
  | "cyberpunk"
  | "watercolor"
  | "comic"
  | "3d-render"
  | "fantasy";

export interface StyleConfig {
  artStyle: ArtStyle;
  colorPalette?: string; // e.g. "neon", "pastel", "muted", "vibrant"
  outfit?: string; // description of desired outfit
  background?: string; // background setting
  accessories?: string[]; // headphones, glasses, etc.
  mood?: string; // "energetic", "chill", "mysterious", "fierce"
  customNotes?: string; // free-form user notes
}

// ─── Character ───

export type CharacterStatus =
  | "pending"
  | "analyzing"
  | "analyzed"
  | "generating"
  | "completed"
  | "failed";

export interface Character {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: CharacterStatus;
  identityBlock: IdentityBlock | null;
  bodyBlock: BodyBlock | null;
  styleConfig: StyleConfig | null;
  turnaroundUrl: string | null;
  portraitUrl: string | null;
  metadata: Record<string, unknown>;
}

// ─── Generation ───

export interface GenerationRequest {
  characterId: string;
  identityBlock: IdentityBlock;
  bodyBlock: BodyBlock | null;
  styleConfig: StyleConfig;
  /** Original face photos as base64 — used as reference for realistic style */
  referencePhotos?: Array<{ base64: string; mimeType: string }>;
}

export interface GenerationResult {
  turnaroundImageBase64: string;
  portraitImageBase64: string;
  turnaroundMimeType: string;
  portraitMimeType: string;
}

// ─── Analysis ───

export interface AnalysisRequest {
  facePhotos: Buffer[]; // 3-5 face photo buffers
  bodyPhotos?: Buffer[]; // 0-3 body photo buffers
  mimeTypes: string[]; // corresponding MIME types
}

export interface AnalysisResult {
  identityBlock: IdentityBlock;
  bodyBlock: BodyBlock | null;
}
