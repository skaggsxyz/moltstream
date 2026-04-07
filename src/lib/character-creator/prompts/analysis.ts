/**
 * Prompt templates for Gemini Vision analysis
 */

export const FACE_ANALYSIS_PROMPT = `You are an expert character designer analyzing reference photos of a real person.
Your job is to extract precise visual identity features that will be used to generate a stylized avatar.

Analyze the provided face photos carefully and return a JSON object with the following structure:

{
  "faceShape": "<oval|round|square|heart|oblong|diamond|rectangle>",
  "nose": {
    "shape": "<straight|button|aquiline|snub|roman|bulbous|upturned>",
    "size": "<small|medium|large>",
    "bridge": "<narrow|medium|wide>"
  },
  "lips": {
    "shape": "<full|thin|bow-shaped|wide|downturned|upturned>",
    "size": "<small|medium|full>"
  },
  "eyes": {
    "shape": "<almond|round|hooded|monolid|downturned|upturned|deep-set>",
    "size": "<small|medium|large>",
    "color": "<color description>",
    "spacing": "<close-set|average|wide-set>"
  },
  "eyebrows": {
    "shape": "<arched|straight|curved|angled|s-shaped>",
    "thickness": "<thin|medium|thick>",
    "color": "<color description>"
  },
  "skinTone": {
    "shade": "<fair|light|medium|olive|tan|brown|dark>",
    "undertone": "<warm|cool|neutral>"
  },
  "hair": {
    "color": "<color description>",
    "texture": "<straight|wavy|curly|coily>",
    "length": "<bald|buzzcut|short|medium|long|very long>",
    "style": "<description of current hairstyle>"
  },
  "distinguishingFeatures": ["<list of moles, scars, dimples, freckles, piercings, birthmarks, etc.>"],
  "overallVibe": "<A short 1-2 sentence summary of the person's visual identity and energy>"
}

IMPORTANT:
- Be precise and specific. These descriptions will be used to generate an avatar.
- Look across ALL provided photos for the most consistent features.
- For "distinguishingFeatures", note anything that makes this face unique.
- Return ONLY valid JSON, no markdown formatting, no code blocks.`;

export const BODY_ANALYSIS_PROMPT = `You are an expert character designer analyzing reference photos of a real person's body/figure.
Your job is to extract physical build characteristics that will be used to generate a full-body stylized avatar.

Analyze the provided body photos carefully and return a JSON object with the following structure:

{
  "build": "<slim|athletic|average|muscular|stocky|plus-size|curvy>",
  "proportions": {
    "shoulders": "<narrow|average|broad>",
    "torso": "<short|average|long>",
    "legs": "<short|average|long>"
  },
  "estimatedHeight": "<short|below-average|average|above-average|tall>",
  "tattoos": ["<description of visible tattoos, if any>"],
  "distinguishingFeatures": ["<posture notes, distinctive body language, visible accessories, etc.>"]
}

IMPORTANT:
- Be respectful and clinical in descriptions.
- Focus on proportions and build that matter for avatar generation.
- Return ONLY valid JSON, no markdown formatting, no code blocks.`;
