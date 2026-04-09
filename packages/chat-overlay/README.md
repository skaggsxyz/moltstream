# @moltstream/chat-overlay

Dual-source live chat overlay for OBS Browser Source.

Listens to **Kick.com** chat (via Pusher WebSocket) and **pump.fun** token chat
(via socket.io / `pump-chat-client`) and renders messages over a full-canvas
scene as an HTML page, ready to drop into OBS as a Browser Source.

## Run

```bash
npm install
npm run dev -- \
  --port 3939 \
  --channel skg0001 \
  --chatroom 99424831 \
  --pumpfun DvPrtU3yodB42CafgjmjoLV7zeNH2YMBB73guBZLpump
```

- HTTP overlay: `http://localhost:3939/` (add as OBS Browser Source, 1920x1080)
- WebSocket: `ws://localhost:3939/ws`

## OBS automation

```bash
# Add Browser Source "Kick Overlay" to the current scene
npm run setup-obs

# Hot-refresh the browser source after HTML changes
npm run refresh-obs
```

Requires OBS v32+ with the built-in `obs-websocket` server enabled on
`ws://localhost:4455` (no auth, default).

## Visual grammar

- **KICK** messages — neon green border, `KICK` badge
- **PUMP** messages — lime border on dark-green background, `PUMP` badge
- Messages fade out after 30s, max 15 visible at once
