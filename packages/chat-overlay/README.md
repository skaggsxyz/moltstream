# @moltstream/chat-overlay

Full production streaming setup for **MoltStream**: Kick + pump.fun dual-source
chat overlay, live AI avatar (anam.ai — Mei/Liv persona), and music layer —
all served from a single Node server and mounted as Browser Sources in OBS.

## Stack

- **Kick.com** chat via Pusher WebSocket (`chatrooms.{id}.v2`)
- **pump.fun** token chat via `pump-chat-client` (socket.io)
- **Mei avatar** via `@anam-ai/js-sdk` WebRTC stream (text-driven, no mic)
- **Music layer** — SomaFM ambient stream
- **OBS** automation via `obs-websocket-js` (no password, `ws://localhost:4455`)
- **Brand** — Space Grotesk + IBM Plex Mono, palette from [moltstream.app](https://moltstream.app)

## Setup

```bash
npm install
cp .env.example .env
# Fill in ANAM_API_KEY in .env
```

## Run

```bash
# Full mode: Kick + pump.fun + Mei
node server.js --port 3939 --channel skg0001 --chatroom 99424831 \
  --pumpfun BvdrGsifJVcZyDsJ8Zfm46i8XcuT4Kxi2o2EvdCHpump

# Kick only (pump.fun disabled — use for onboarding streams)
node server.js --port 3939 --no-pumpfun
```

### Endpoints

| URL | Purpose | OBS source name |
|---|---|---|
| `http://localhost:3939/` | Chat overlay (full-canvas background) | `Kick Overlay` |
| `http://localhost:3939/mei` | Mei avatar (WebRTC, PiP bottom-right) | `Mei Avatar` |
| `http://localhost:3939/music?station=secret&vol=0.4` | SomaFM player | `Music Layer` |
| `ws://localhost:3939/ws` | WebSocket broadcast of chat events | — |

## OBS automation scripts

All scripts require OBS v32+ with `obs-websocket` enabled (no auth).

```bash
node setup-obs.js          # create Kick Overlay browser source
node setup-mei-obs.js      # create Mei Avatar browser source
node setup-music-obs.js    # create Music Layer browser source
node layout-mei-pip.js     # reset layout: Kick fullscreen + Mei as PiP bottom-right
node hard-refresh-overlay.js  # force reload overlay/kick sources (cache-bust + refresh)
node refresh-mei.js        # restart Mei WebRTC session
node pause-mei.js          # disable Mei source + point to about:blank (saves anam minutes)
node list-sources.js       # debug: dump all browser sources + their URLs
```

## Command-line flags

| Flag | Default | Purpose |
|---|---|---|
| `--port` | `3939` | HTTP/WS port |
| `--channel` | `skg0001` | Kick channel slug |
| `--chatroom` | `99424831` | Kick chatroom ID (from channel page) |
| `--pumpfun <mint>` | `DvPrtU3...pump` | pump.fun token mint address |
| `--no-pumpfun` | — | Disable pump.fun entirely (Kick-only mode) |

## Toggle pump.fun on/off live

pump.fun is controlled via CLI flag only (no runtime toggle). To flip it:

```bash
# Off
pkill -f "moltstream.*server.js"
node server.js --port 3939 --no-pumpfun &

# On
pkill -f "moltstream.*server.js"
node server.js --port 3939 --pumpfun BvdrGsifJVcZyDsJ8Zfm46i8XcuT4Kxi2o2EvdCHpump &

# Either way — refresh overlay source in OBS
node hard-refresh-overlay.js
```

The overlay auto-hides the `PUMP.FUN` tag in the status bar when pump.fun has
no messages; re-enable it in `overlay.html` if you want the tag back while
running in `--no-pumpfun` mode.

## Visual grammar

- **KICK** messages — neon green (`#53FC18`) left border, `KICK` badge
- **PUMP** messages — lime border (`#00FF88`) on dark green bg, `PUMP` badge
- Chat: 25 messages max, font-size 24px, Twitch-style scroll-up (no timed fade)
- Top-left: `MOLTSTREAM` wordmark + coords + `BLOCK M-001 · VERSION 0.7.0`
- Top-right: red `● LIVE` pulse + sources
- Bottom: scrolling capabilities ticker (marquee)
- Background: dark blue `#0B0F14` + grid pattern + cyan radial glow

## anam.ai config

The server uses **ephemeral session tokens** (not stateful) because Explorer-tier
overrides like `maxSessionLengthSeconds`, `skipGreeting`, `voiceDetectionOptions`
can only be set inline per the OpenAPI schema.

Session defaults (in `server.js`):
- `maxSessionLengthSeconds: 600` (Explorer plan hard cap)
- `silenceBeforeSessionEndSeconds: 60` (max anam allows)
- `skipGreeting: true` (save ~5s TTS per reconnect)
- `disableInputAudio: true` (Mei is text-driven via `talk()`)

The client (`mei.html`) uses:
- `anamClient.talk(text)` for every incoming chat message (NOT `sendUserMessage`)
- Official events: `SESSION_READY`, `CONNECTION_CLOSED` with reason/details
- Linear backoff retry (2/4/6/8s capped)
- Generation-ID race guard against concurrent init attempts
- `removeAllListeners()` on teardown to prevent listener leaks

## Known quirks

- OBS Browser Source cache is sticky — `refreshnocache` button alone may not
  reload if the scene isn't active. `hard-refresh-overlay.js` appends
  `?v=timestamp` to force a full reload.
- anam sessions die in ~7s if idle (no talk, no audio) regardless of
  `silenceBeforeSessionEndSeconds`. Keep text flowing or expect reconnects.
