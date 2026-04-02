# 🔴 MoltStream

**The streaming runtime built for non-human broadcasters.**

Deploy autonomous AI streamers on Kick with one command. No OBS manual setup, no bot scripts, no duct tape.

[![npm version](https://img.shields.io/npm/v/moltstream)](https://www.npmjs.com/package/moltstream)
[![CI](https://github.com/skaggsxyz/moltstream/actions/workflows/ci.yml/badge.svg)](https://github.com/skaggsxyz/moltstream/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What is MoltStream?

MoltStream is an agent-native streaming runtime. It turns an LLM into a live broadcaster — reading chat, generating responses, speaking through TTS, animating an avatar with lip sync, and pushing it all to Kick via OBS.

**Without MoltStream:** a week of manual setup — OBS scenes, chat bots, TTS wiring, avatar rendering, deployment scripts.

**With MoltStream:** `npx moltstream start`. 30 seconds.

---

## Quick Start

```bash
# Configure your agent
npx moltstream init

# Go live
npx moltstream start
```

Your AI agent is now streaming on Kick with:
- 💬 **Real-time chat** — reads and responds to viewers via Kick WebSocket
- 🧠 **LLM brain** — Gemini 2.5 Flash (default) or Anthropic Claude
- 🔊 **TTS voice** — Fish Audio, ElevenLabs, or OpenAI
- 🎭 **Animated avatar** — character with lip sync + chat overlay
- 📡 **OBS integration** — streams to Kick via RTMP/RTMPS

---

## How It Works

```
Kick Chat (WebSocket)
    │
    ▼
┌──────────────────────────────────────┐
│            MoltStream                │
│                                      │
│  ┌─────────┐   ┌─────┐   ┌───────┐  │
│  │ Kick    │──▸│ LLM │──▸│  TTS  │  │
│  │ Chat    │   │     │   │       │  │
│  └─────────┘   └──┬──┘   └───┬───┘  │
│                   │           │      │
│              Gemini 2.5    Audio     │
│              Flash         Buffer    │
│                   │           │      │
│              ┌────▼───────────▼───┐  │
│              │      Avatar        │  │
│              │  Lip Sync + Chat   │  │
│              │     Overlay        │  │
│              └────────┬───────────┘  │
│                       │              │
└───────────────────────┼──────────────┘
                        │ Browser Source
                        ▼
                  OBS → Kick RTMP
```

**Pipeline:**

1. **Chat ingestion** — Kick WebSocket connects to your channel's chatroom
2. **LLM reasoning** — Messages are sent to Gemini (or Claude) for response generation
3. **Voice synthesis** — Response text is converted to speech via Fish Audio / ElevenLabs / OpenAI
4. **Avatar rendering** — Browser-based avatar animates lip sync to audio, displays chat overlay
5. **Broadcast** — OBS captures the avatar Browser Source and streams to Kick via RTMP

---

## Packages

MoltStream is a TypeScript monorepo managed with [Turborepo](https://turbo.build/).

| Package | Description |
|---------|-------------|
| [`@moltstream/core`](packages/core) | Agent runtime, state management, memory, event bus |
| [`@moltstream/orchestrator`](packages/orchestrator) | Scene graph engine, event queue, deterministic execution |
| [`@moltstream/kick-chat`](packages/kick-chat) | Kick chatroom WebSocket client |
| [`@moltstream/streamer`](packages/streamer) | Core pipeline orchestrator (chat → LLM → TTS → avatar) |
| [`@moltstream/tts`](packages/tts) | Text-to-speech providers (Fish Audio / ElevenLabs / OpenAI) |
| [`@moltstream/avatar`](packages/avatar) | Animated avatar with lip sync + chat overlay |
| [`@moltstream/broadcast`](packages/broadcast) | FFmpeg RTMP broadcast (experimental) |
| [`@moltstream/narrative`](packages/narrative) | Real-time narrative detection engine |
| [`@moltstream/container`](packages/container) | Docker-based agent isolation runtime |
| [`@moltstream/adapters`](packages/adapters) | Platform adapters (Kick, extensible) |
| [`@moltstream/bridge`](packages/bridge) | Action serialization, priority queuing, rollback |
| [`@moltstream/policy`](packages/policy) | Content filtering, rate limits, emergency stop |
| [`@moltstream/audit`](packages/audit) | Reasoning traces, decision logs, metrics |
| [`moltstream`](packages/cli) | CLI — `init`, `start`, `status` |

---

## Project Structure

```
moltstream/
├── packages/
│   ├── core/           # Agent runtime, state, memory
│   ├── orchestrator/   # Scene graph, event queue
│   ├── kick-chat/      # Kick WebSocket client
│   ├── streamer/       # Pipeline orchestrator
│   ├── tts/            # TTS providers
│   ├── avatar/         # Avatar + lip sync + overlay
│   ├── broadcast/      # FFmpeg RTMP (experimental)
│   ├── narrative/      # Narrative detection
│   ├── container/      # Docker agent isolation
│   ├── adapters/       # Platform adapters
│   ├── bridge/         # Action serialization
│   ├── policy/         # Content safety
│   ├── audit/          # Reasoning traces
│   ├── cli/            # CLI tooling
│   └── character-creator/ # AI character generation (Gemini)
├── apps/
│   ├── web/            # Landing page
│   └── character-web/  # Character creator frontend
├── examples/
│   ├── basic-agent/        # Minimal streaming agent
│   ├── react-to-chat/      # Chat-reactive agent
│   └── multi-agent-debate/ # Multi-agent debate stream
├── docs/               # Architecture documentation
├── supabase/           # Database migrations
└── .github/workflows/  # CI pipeline
```

---

## Configuration

`npx moltstream init` generates a `moltstream.yaml`:

```yaml
agent:
  name: "MyAgent"
  personality: "A witty, engaging AI streamer"

platform:
  type: kick
  channel: my-channel

llm:
  provider: gemini
  apiKey: "your-gemini-key"
  model: gemini-2.5-flash

tts:
  provider: fish
  apiKey: "your-fish-audio-key"

avatar:
  enabled: true
  port: 3939

broadcast:
  enabled: true
  rtmpUrl: "rtmps://..."
  streamKey: "sk_..."
```

### Environment Variables

```bash
KICK_CHANNEL=your-channel
KICK_CHATROOM_ID=12345          # Optional — auto-resolves from channel
GEMINI_API_KEY=your-key         # Required (or ANTHROPIC_API_KEY)
TTS_PROVIDER=fish               # fish | elevenlabs | openai
TTS_API_KEY=your-key
AVATAR_ENABLED=true
```

---

## OBS Setup

MoltStream works with OBS via Browser Source.

### Automatic (recommended)

```bash
npx moltstream start
# MoltStream configures OBS via WebSocket API
```

### Manual

1. Install OBS: `brew install --cask obs`
2. Add **Browser Source** → `http://localhost:3939`
3. Enable "Control audio via OBS" in Browser Source settings
4. Set Stream → Custom → your Kick RTMP URL + stream key
5. Start Streaming

The avatar page renders:
- Animated character with real-time lip sync
- Live chat panel (viewer messages)
- Bot response bubble
- LIVE badge

---

## Examples

### Basic Agent

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

See more in [`examples/`](examples/).

---

## Requirements

- **Node.js** 20+
- **pnpm** (package manager)
- **OBS Studio** 28+ (for streaming to Kick)
- **Gemini API key** ([get one free](https://aistudio.google.com/apikey)) or Anthropic API key
- **Kick account** with stream key
- **TTS API key** — Fish Audio, ElevenLabs, or OpenAI

---

## Development

```bash
git clone https://github.com/skaggsxyz/moltstream.git
cd moltstream
pnpm install
pnpm run build

# Run in dev mode
pnpm run dev

# Run tests
pnpm run test
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Avatar not rendering | Check that port 3939 is free. Run `lsof -i :3939` to find conflicts |
| OBS not capturing audio | Enable "Control audio via OBS" in Browser Source properties |
| Kick chat not connecting | Verify `KICK_CHANNEL` is set. Chatroom ID auto-resolves if omitted |
| TTS silent / no audio | Check your TTS API key and provider setting in `moltstream.yaml` |
| FFmpeg broadcast fails on macOS | Known macOS lavfi pacing issue — use OBS instead of FFmpeg direct |
| LLM not responding | Verify `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` is set and valid |

---

## Documentation

- [Getting Started](docs/getting-started.md)
- [Scene Graph](docs/scene-graph.md)
- [Policy Engine](docs/policy-engine.md)
- [Reasoning Traces](docs/traces.md)
- [Agent Experience](docs/agent-experience.md)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

---

## License

[MIT](LICENSE) © Tyler Skaggs

---

**Website:** [moltstream.app](https://moltstream.app)
**npm:** [npmjs.com/package/moltstream](https://www.npmjs.com/package/moltstream)
