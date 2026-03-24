# ⚡ MoltStream

**AI-native streaming infrastructure.** One command to go live with an autonomous AI streamer.

> Your AI agent has no audience. OBS wasn't built for autonomous agents. **We fix that.**

[![CI](https://github.com/skaggsxyz/moltstream/actions/workflows/ci.yml/badge.svg)](https://github.com/skaggsxyz/moltstream/actions)

## Quick Start

```bash
npx moltstream init
npx moltstream start
```

## What It Does

MoltStream connects an AI agent to a live streaming platform with voice, avatar, and chat interaction — all from a single command.

```
Kick/Twitch Chat → Claude LLM → TTS Voice → Live2D Avatar → Stream
       ↑                                                        |
       └────────────────── responds in chat ←───────────────────┘
```

## Pipeline

| Component | Package | Description |
|-----------|---------|-------------|
| 💬 Chat | `@moltstream/kick-chat` | Kick.com WebSocket chat client |
| 🧠 LLM | `@moltstream/streamer` | Claude-powered response generation |
| 🔊 TTS | `@moltstream/tts` | Fish Audio / ElevenLabs / OpenAI |
| 🎭 Avatar | `@moltstream/avatar` | Live2D with lip sync (OBS Browser Source) |
| ⚡ CLI | `moltstream` | Init wizard + one-command startup |

## Configuration

`moltstream init` generates a `moltstream.yaml`:

```yaml
agent:
  name: "MoltBot"
  personality: "A witty AI streamer who loves tech"

platform:
  type: "kick"
  channel: "your-channel"

llm:
  provider: "anthropic"
  apiKey: "sk-..."
  model: "claude-sonnet-4-20250514"

tts:
  provider: "fish"
  apiKey: "..."

avatar:
  enabled: true
  port: 3939
```

## Architecture

MoltStream is a pnpm monorepo:

```
packages/
├── cli/          # CLI (npx moltstream init/start)
├── kick-chat/    # Kick.com WebSocket client
├── tts/          # Text-to-speech (multi-provider)
├── avatar/       # Live2D avatar + lip sync server
├── streamer/     # Pipeline orchestrator
├── core/         # Core types & config
├── adapters/     # Platform adapters
├── orchestrator/ # Agent orchestration
├── policy/       # Content policy engine
├── bridge/       # Platform bridges
├── container/    # Container runtime
├── audit/        # Audit logging
└── narrative/    # Narrative engine
```

## Requirements

- Node.js 18+
- Anthropic API key (Claude)
- TTS API key (Fish Audio recommended — free tier)
- Kick/Twitch/YouTube account + stream key
- OBS Studio (for compositing + RTMP)

## Development

```bash
git clone https://github.com/skaggsxyz/moltstream.git
cd moltstream
pnpm install
pnpm run build
```

## License

MIT
