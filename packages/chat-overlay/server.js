/**
 * MoltStream Chat Overlay Server
 *
 * Dual-source chat listener:
 *  - Kick.com (Pusher WebSocket)
 *  - pump.fun token chat (socket.io via pump-chat-client)
 *
 * Serves browser overlay HTML + pushes messages to connected browser clients.
 *
 * Usage:
 *   node server.js --port 3939 \
 *     --channel skg0001 --chatroom 99424831 \
 *     --pumpfun DvPrtU3yodB42CafgjmjoLV7zeNH2YMBB73guBZLpump
 */

import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PumpChatClient } from 'pump-chat-client';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───
const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}

const CHANNEL = getArg('channel', 'skg0001');
const CHATROOM_ID = parseInt(getArg('chatroom', '99424831'), 10);
const PORT = parseInt(getArg('port', '3939'), 10);
const PUMPFUN_MINT = getArg('pumpfun', 'DvPrtU3yodB42CafgjmjoLV7zeNH2YMBB73guBZLpump');

const PUSHER_WS = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false';

console.log(`\n  ╔══════════════════════════════════════════╗`);
console.log(`  ║   MoltStream Chat Overlay                ║`);
console.log(`  ║   Kick: ${CHANNEL.padEnd(32)}║`);
console.log(`  ║   Chatroom: ${String(CHATROOM_ID).padEnd(28)}║`);
console.log(`  ║   PumpFun: ${(PUMPFUN_MINT ? PUMPFUN_MINT.slice(0, 16) + '...' : 'none').padEnd(29)}║`);
console.log(`  ║   Overlay: http://localhost:${String(PORT).padEnd(12)}║`);
console.log(`  ╚══════════════════════════════════════════╝\n`);

// ─── Browser clients (OBS Browser Source) ───
const browserClients = new Set();

// ─── HTTP Server (serves overlay.html) ───
const server = createServer((req, res) => {
  if (req.url === '/' || req.url === '/chat-overlay' || req.url === '/index.html') {
    const htmlPath = join(__dirname, 'overlay.html');
    if (existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('overlay.html not found');
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

// ─── WebSocket Server (for browser overlay clients) ───
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  browserClients.add(ws);
  console.log(`[overlay] Browser client connected (${browserClients.size} total)`);

  ws.on('close', () => {
    browserClients.delete(ws);
    console.log(`[overlay] Browser client disconnected (${browserClients.size} total)`);
  });
});

// ─── Broadcast to all browser clients ───
function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const client of browserClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// ─── Kick Chat via Pusher ───
let kickWs = null;
let reconnectTimer = null;

function connectKick() {
  console.log('[kick] Connecting to Pusher...');
  kickWs = new WebSocket(PUSHER_WS);

  kickWs.on('open', () => {
    console.log('[kick] Pusher WebSocket connected');
  });

  kickWs.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handlePusherMessage(msg);
    } catch {
      // ignore non-JSON
    }
  });

  kickWs.on('close', () => {
    console.log('[kick] Disconnected, reconnecting in 3s...');
    scheduleReconnect();
  });

  kickWs.on('error', (err) => {
    console.error('[kick] Error:', err.message);
  });
}

function handlePusherMessage(msg) {
  const event = msg.event;

  if (event === 'pusher:connection_established') {
    const subscribeMsg = JSON.stringify({
      event: 'pusher:subscribe',
      data: { auth: '', channel: `chatrooms.${CHATROOM_ID}.v2` },
    });
    kickWs.send(subscribeMsg);
    console.log(`[kick] Subscribed to chatrooms.${CHATROOM_ID}.v2`);
    return;
  }

  if (event === 'pusher_internal:subscription_succeeded') {
    console.log('[kick] ✅ Subscription confirmed — listening for chat messages');
    return;
  }

  if (event === 'App\\Events\\ChatMessageEvent') {
    try {
      const data = JSON.parse(msg.data);
      const username = data.sender?.username ?? 'unknown';
      const content = data.content ?? '';
      const color = data.sender?.identity?.color ?? '#00FFFF';

      if (content.trim()) {
        console.log(`[kick] ${username}: ${content}`);
        broadcast({
          type: 'chat',
          source: 'kick',
          username,
          content,
          color,
          timestamp: data.created_at || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('[kick] Parse error:', e.message);
    }
    return;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    console.log('[kick] Reconnecting...');
    connectKick();
  }, 3000);
}

// ─── PumpFun Chat via pump-chat-client ───
let pumpClient = null;

function connectPumpFun() {
  if (!PUMPFUN_MINT) {
    console.log('[pumpfun] No mint address provided, skipping');
    return;
  }

  console.log(`[pumpfun] Connecting to ${PUMPFUN_MINT}...`);

  pumpClient = new PumpChatClient({
    roomId: PUMPFUN_MINT,
    username: 'moltstream-observer',
    messageHistoryLimit: 50,
  });

  pumpClient.on('connected', () => {
    console.log('[pumpfun] ✅ Connected to chat room');
  });

  pumpClient.on('disconnected', () => {
    console.log('[pumpfun] Disconnected');
  });

  pumpClient.on('message', (msg) => {
    const username = msg.username || 'anon';
    const content = msg.message || '';
    if (!content.trim()) return;

    console.log(`[pumpfun] ${username}: ${content}`);
    broadcast({
      type: 'chat',
      source: 'pumpfun',
      username,
      content,
      color: '#00FF88',
      timestamp: msg.timestamp || new Date().toISOString(),
    });
  });

  pumpClient.on('error', (err) => {
    console.error('[pumpfun] Error:', err?.message || err);
  });

  pumpClient.on('serverError', (err) => {
    console.error('[pumpfun] Server error:', err);
  });

  pumpClient.on('maxReconnectAttemptsReached', () => {
    console.error('[pumpfun] Max reconnect attempts reached, will retry in 30s');
    setTimeout(connectPumpFun, 30000);
  });

  pumpClient.connect();
}

// ─── Start ───
server.listen(PORT, () => {
  console.log(`[server] HTTP + WS listening on http://localhost:${PORT}`);
  console.log(`[server] Overlay URL: http://localhost:${PORT}/chat-overlay`);
  console.log(`[server] Add this as Browser Source in OBS\n`);
  connectKick();
  connectPumpFun();
});

process.on('SIGINT', () => {
  console.log('\n[server] Shutting down...');
  if (kickWs) kickWs.close();
  if (pumpClient) pumpClient.disconnect();
  server.close();
  process.exit(0);
});
