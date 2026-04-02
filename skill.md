---
name: moltstream
description: >
  AI agent-native streaming runtime for Kick. Use MoltStream to build agents
  that operate live streams — react to chat, generate voiced responses, animate
  avatars with lip sync, and broadcast to Kick via OBS. One command to go live.
capabilities:
  - kick-streaming
  - chat-reaction
  - tts-voice-synthesis
  - avatar-lip-sync
  - obs-integration
  - scene-composition
  - reasoning-trace-logging
  - character-generation
context_cost: 500
ttfa_minutes: 3
min_context_window: 8000
auth: api-key
---

# MoltStream Skill

## What you can do
- Deploy an AI-powered live stream on Kick with one command
- React to viewer chat in real-time via LLM (Gemini / Claude)
- Generate voiced responses (Fish Audio / ElevenLabs / OpenAI)
- Animate an avatar with lip sync and chat overlay
- Compose scenes declaratively (video, overlays, audio)
- Enforce content policies and safety guardrails
- Log every decision as a structured reasoning trace
- Generate AI characters from photos (Gemini Vision + Imagen)

## Quick start
```bash
npx moltstream init     # configure your agent
npx moltstream start    # go live on Kick
```

## Core API
```typescript
import { MoltAgent } from '@moltstream/core';

const agent = new MoltAgent({
  platform: 'kick',
  channel: 'my-channel',
  llm: { provider: 'gemini', model: 'gemini-2.5-flash' },
  tts: { provider: 'fish' },
});

agent.onChat(async (message, ctx) => {
  const response = await ctx.llm.generate(message.text);
  await ctx.tts.speak(response);
});

agent.start();
```

## Error handling
All errors are typed and include:
- `code`: Machine-readable error identifier
- `retryable`: Boolean flag
- `retryAfter`: Milliseconds until retry (when applicable)
- `suggestion`: Human/agent-readable recovery guidance

## Packages
| Package | Purpose |
|---------|---------|
| @moltstream/core | Agent runtime, state, memory, event bus |
| @moltstream/orchestrator | Scene graph, event queue |
| @moltstream/kick-chat | Kick chatroom WebSocket client |
| @moltstream/streamer | Pipeline orchestrator |
| @moltstream/tts | TTS providers (Fish / ElevenLabs / OpenAI) |
| @moltstream/avatar | Avatar + lip sync + overlay |
| @moltstream/broadcast | FFmpeg RTMP (experimental) |
| @moltstream/adapters | Platform adapters (Kick) |
| @moltstream/bridge | Action serialization, rollback |
| @moltstream/policy | Content safety, rate limits |
| @moltstream/audit | Reasoning traces, metrics |
| @moltstream/narrative | Narrative detection engine |
| @moltstream/container | Docker agent isolation |
| @moltstream/cli | CLI (init, start, status) |
| @moltstream/character-creator | AI character generation |

## Links
- GitHub: https://github.com/skaggsxyz/moltstream
- Website: https://moltstream.app
- npm: https://www.npmjs.com/package/moltstream
- Examples: https://github.com/skaggsxyz/moltstream/tree/main/examples
