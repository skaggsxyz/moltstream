# Contributing to MoltStream

Contributions welcome. Here's how to get started.

## Setup

```bash
git clone https://github.com/skaggsxyz/moltstream.git
cd moltstream
pnpm install
pnpm run build
```

## Development

```bash
# Run all packages in dev mode
pnpm run dev

# Run tests
pnpm run test

# Lint
pnpm run lint
```

## Architecture

MoltStream is a TypeScript monorepo managed with [Turborepo](https://turbo.build/). Each package in `packages/` is an independent module:

| Package | Purpose |
|---------|---------|
| **core** | Agent runtime, session management, state, memory, event bus |
| **orchestrator** | Scene graph engine, event queue, deterministic execution |
| **kick-chat** | Kick chatroom WebSocket client |
| **streamer** | Core pipeline orchestrator (chat → LLM → TTS → avatar) |
| **tts** | Text-to-speech providers (Fish Audio / ElevenLabs / OpenAI) |
| **avatar** | Animated avatar with lip sync + chat overlay |
| **broadcast** | FFmpeg RTMP broadcast (experimental) |
| **adapters** | Platform adapters (Kick) |
| **bridge** | Action serialization, priority queuing, rollback |
| **policy** | Content filtering, rate limits, emergency stop |
| **audit** | Reasoning traces, decision logs, metrics |
| **narrative** | Real-time narrative detection engine |
| **container** | Docker-based agent isolation runtime |
| **cli** | CLI tooling (`init`, `start`, `status`) |

## Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Write tests for new functionality
4. Ensure `pnpm run test` passes
5. Submit a PR with a clear description

## Code Style

- TypeScript strict mode
- Prettier for formatting
- No `any` types unless absolutely necessary
- Document public APIs with JSDoc comments
