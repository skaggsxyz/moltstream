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
  // Return the raw arg (including empty string) when flag is present,
  // otherwise fall back to the default. Empty string = explicitly disabled.
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return def;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const CHANNEL = getArg('channel', 'skg0001');
const CHATROOM_ID = parseInt(getArg('chatroom', '99424831'), 10);
const PORT = parseInt(getArg('port', '3939'), 10);
// --no-pumpfun disables pump.fun entirely; --pumpfun "" also works
const PUMPFUN_DISABLED = hasFlag('no-pumpfun');
const PUMPFUN_MINT = PUMPFUN_DISABLED ? '' : getArg('pumpfun', 'DvPrtU3yodB42CafgjmjoLV7zeNH2YMBB73guBZLpump');

// Anam.ai config (Mei / Liv persona)
// Secrets MUST come from env — no hardcoded fallbacks in git.
const ANAM_API_KEY = process.env.ANAM_API_KEY;
const ANAM_PERSONA_ID = process.env.ANAM_PERSONA_ID || '85c53e0b-c9b4-4409-a4ed-0bdded9f9800';
if (!ANAM_API_KEY) {
  console.error('\n❌ ANAM_API_KEY env var is required. Set it in .env or export it.');
  console.error('   Example: export ANAM_API_KEY="your-key-here"\n');
  process.exit(1);
}

// Cached full persona config (loaded once at boot from Anam API)
let cachedPersonaConfig = null;

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

// ─── HTTP Server (serves overlay.html + mei.html + session token API) ───
// We use EPHEMERAL session tokens because Explorer-tier overrides like
//   maxSessionLengthSeconds, skipGreeting, voiceDetectionOptions
// can ONLY be set inline (per OpenAPI schema for /v1/auth/session-token).
// Stateful tokens (personaId only) lock us out of these per-session knobs.
// Reference: https://anam.ai/docs/api-reference/create-session-token
async function loadPersonaConfig() {
  console.log(`[anam] Loading persona ${ANAM_PERSONA_ID}...`);
  const res = await fetch(`https://api.anam.ai/v1/personas/${ANAM_PERSONA_ID}`, {
    headers: { 'Authorization': `Bearer ${ANAM_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to load persona: ${res.status}`);
  }
  const persona = await res.json();
  // Build ephemeral personaConfig matching the createSessionToken schema:
  cachedPersonaConfig = {
    name: persona.name,
    avatarId: persona.avatar.id,
    avatarModel: persona.avatarModel || 'cara-3',
    voiceId: persona.voice.id,
    llmId: persona.llmId,
    systemPrompt: persona.brain?.systemPrompt || '',
    // Explorer plan max session length: 600s (10 min hard cap)
    maxSessionLengthSeconds: 600,
    // Don't waste seconds on greeting on every reconnect
    skipGreeting: true,
    // VAD: keep idle session alive for 60s of silence (max anam allows)
    voiceDetectionOptions: {
      endOfSpeechSensitivity: 0.5,
      silenceBeforeSkipTurnSeconds: 30,
      silenceBeforeSessionEndSeconds: 60,
    },
  };
  console.log(`[anam] ✅ Persona: ${persona.name} (avatar: ${persona.avatar.displayName}, voice: ${persona.voice.displayName}, tools: ${(persona.tools||[]).length})`);
  console.log(`[anam] systemPrompt: ${(persona.brain?.systemPrompt || '').slice(0, 80)}...`);
  return cachedPersonaConfig;
}

async function endStaleSessions() {
  try {
    const res = await fetch('https://api.anam.ai/v1/sessions?limit=10', {
      headers: { 'Authorization': `Bearer ${ANAM_API_KEY}` },
    });
    if (!res.ok) return;
    const { data } = await res.json();
    const stale = data.filter((s) => !s.endTime);
    for (const s of stale) {
      console.log(`[anam] Ending stale session ${s.id}...`);
      await fetch(`https://api.anam.ai/v1/sessions/${s.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ANAM_API_KEY}` },
      }).catch(() => {});
    }
    if (stale.length > 0) {
      console.log(`[anam] Cleaned ${stale.length} stale session(s), waiting 5s for release...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  } catch (err) {
    console.error('[anam] endStaleSessions error:', err.message);
  }
}

async function getAnamSessionToken() {
  if (!cachedPersonaConfig) {
    await loadPersonaConfig();
  }
  const res = await fetch('https://api.anam.ai/v1/auth/session-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientLabel: 'moltstream-overlay',
      personaConfig: cachedPersonaConfig,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anam API ${res.status}: ${text}`);
  }
  return res.json();
}

const server = createServer(async (req, res) => {
  // Strip query string for routing (cache-busters like ?v=123 shouldn't 404)
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '/chat-overlay' || urlPath === '/index.html') {
    const htmlPath = join(__dirname, 'overlay.html');
    if (existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('overlay.html not found');
    }
  } else if (urlPath === '/mei' || urlPath === '/mei.html') {
    const htmlPath = join(__dirname, 'mei.html');
    if (existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('mei.html not found');
    }
  } else if (urlPath.startsWith('/music')) {
    const htmlPath = join(__dirname, 'music.html');
    if (existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('music.html not found');
    }
  } else if (urlPath === '/api/session-token' && req.method === 'POST') {
    try {
      const data = await getAnamSessionToken();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      console.log('[anam] session token issued');
    } catch (err) {
      console.error('[anam] token error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
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
let pumpErrorCount = 0;
let pumpSilentMode = false;
let pumpHibernating = false;

function connectPumpFun() {
  if (!PUMPFUN_MINT) {
    console.log('[pumpfun] No mint address provided, skipping');
    return;
  }
  if (pumpHibernating) {
    console.log('[pumpfun] Hibernating, will resume later');
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
    pumpErrorCount = 0;
    pumpSilentMode = false;
  });

  pumpClient.on('disconnected', () => {
    if (!pumpSilentMode) console.log('[pumpfun] Disconnected');
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
    pumpErrorCount++;
    if (pumpErrorCount === 3) {
      console.warn('[pumpfun] 3 errors in a row, entering silent mode (logs suppressed)');
      pumpSilentMode = true;
    }
    if (pumpErrorCount >= 5) {
      console.warn('[pumpfun] 5 errors — hibernating for 10 minutes');
      pumpHibernating = true;
      try { pumpClient.disconnect(); } catch {}
      setTimeout(() => {
        pumpHibernating = false;
        pumpErrorCount = 0;
        pumpSilentMode = false;
        console.log('[pumpfun] Waking up after hibernation');
        connectPumpFun();
      }, 10 * 60 * 1000);
      return;
    }
    if (!pumpSilentMode) console.error('[pumpfun] Error:', (err?.message || err)?.toString().slice(0, 100));
  });

  pumpClient.on('serverError', (err) => {
    if (!pumpSilentMode) console.error('[pumpfun] Server error:', String(err).slice(0, 100));
  });

  pumpClient.on('maxReconnectAttemptsReached', () => {
    console.error('[pumpfun] Max reconnect attempts reached, hibernating 10min');
    pumpHibernating = true;
    setTimeout(() => {
      pumpHibernating = false;
      pumpErrorCount = 0;
      pumpSilentMode = false;
      connectPumpFun();
    }, 10 * 60 * 1000);
  });

  pumpClient.connect();
}

// ─── Start ───
server.listen(PORT, async () => {
  console.log(`[server] HTTP + WS listening on http://localhost:${PORT}`);
  console.log(`[server] Overlay URL: http://localhost:${PORT}/chat-overlay`);
  console.log(`[server] Mei URL:     http://localhost:${PORT}/mei`);
  console.log(`[server] Add as Browser Sources in OBS\n`);
  try {
    await loadPersonaConfig();
    await endStaleSessions();
  } catch (err) {
    console.error('[anam] boot error:', err.message);
  }
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
