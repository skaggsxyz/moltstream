# 🔴 MoltStream

**AI Agent Streaming Runtime** — deploy autonomous AI streamers on Kick with one command.

[![npm version](https://img.shields.io/npm/v/moltstream)](https://www.npmjs.com/package/moltstream)
[![CI](https://github.com/skaggsxyz/moltstream/actions/workflows/ci.yml/badge.svg)](https://github.com/skaggsxyz/moltstream/actions/workflows/ci.yml)

## What is MoltStream?

Like `create-react-app` but for AI streamers. Without us: a week of manual setup (OBS + chat bot + TTS + avatar + scripts). With us: `npx moltstream start`. 30 seconds.

## Quick Start

```bash
# Configure your agent
npx moltstream init

# Go live
npx moltstream start
```

That's it. Your AI agent is now streaming on Kick with:
- 💬 **Chat bot** reading and responding to viewers
- 🧠 **LLM brain** (Gemini 2.5 Flash / Anthropic Claude)
- 🔊 **TTS voice** (Fish Audio / ElevenLabs / OpenAI)
- 🎭 **Animated avatar** with lip sync
- 📡 **OBS integration** streaming to Kick via RTMP

## Architecture

```
Kick Chat (WebSocket)
    │
    ▼
┌──────────────────────────────────┐
│          MoltStream              │
│                                  │
│  Chat → LLM → TTS → Avatar      │
│         │                │       │
│    Gemini 2.5       Lip Sync     │
│    Flash            + Overlay    │
│                                  │
└──────────────┬───────────────────┘
               │ Browser Source
               ▼
         OBS → Kick RTMP
```

## Packages

| Package | Description |
|---------|-------------|
| `@moltstream/kick-chat` | Kick chatroom WebSocket client |
| `@moltstream/streamer` | Core pipeline orchestrator |
| `@moltstream/tts` | Text-to-speech (Fish/ElevenLabs/OpenAI) |
| `@moltstream/avatar` | Animated avatar with lip sync + chat overlay |
| `@moltstream/broadcast` | FFmpeg RTMP broadcast (experimental) |
| `moltstream` | CLI (`init`, `start`, `status`) |

## Configuration

`moltstream init` generates a `moltstream.yaml`:

```yaml
agent:
  name: "MyAgent"
  personality: "A witty, engaging AI streamer"

platform:
  type: kick
  channel: my-channel

llm:
  provider: gemini
  apiKey: "your-key"
  model: gemini-2.5-flash

tts:
  provider: fish
  apiKey: "your-key"

avatar:
  enabled: true
  port: 3939

broadcast:
  enabled: true
  rtmpUrl: "rtmps://..."
  streamKey: "sk_..."
```

## OBS Setup

MoltStream works with OBS via Browser Source:

### Automatic (recommended)
```bash
# MoltStream configures OBS via WebSocket API
npx moltstream start
```

### Manual
1. Install OBS: `brew install --cask obs`
2. Add **Browser Source** → `http://localhost:3939`
3. Enable "Control audio via OBS" in Browser Source settings
4. Set Stream → Custom Server → your Kick RTMP URL + key
5. Start Streaming

The avatar page includes:
- Animated character with lip sync
- Live chat panel (viewer messages)
- Bot response bubble
- LIVE badge

## Requirements

- **Node.js** 18+
- **OBS Studio** 28+ (for streaming)
- **LLM API key** (Gemini or Anthropic)
- **Kick account** with stream key

## Environment Variables

```bash
KICK_CHANNEL=your-channel
KICK_CHATROOM_ID=12345     # Optional, auto-resolves
GEMINI_API_KEY=your-key    # or ANTHROPIC_API_KEY
AVATAR_ENABLED=true
TTS_PROVIDER=fish           # fish|elevenlabs|openai
TTS_API_KEY=your-key
```

## Development

```bash
git clone https://github.com/skaggsxyz/moltstream.git
cd moltstream
pnpm install
pnpm run build
```

## License

MIT

---

**Website:** [moltstream-site.vercel.app](https://moltstream-site.vercel.app)
**npm:** [npmjs.com/package/moltstream](https://www.npmjs.com/package/moltstream)
