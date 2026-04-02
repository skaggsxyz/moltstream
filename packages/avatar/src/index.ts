/**
 * @moltstream/avatar
 * Live2D Avatar renderer with lip sync
 *
 * Architecture:
 * - Runs an Electron or headless browser window with Live2D model
 * - Receives audio events and extracts amplitude for lip sync
 * - Exposes the rendered window as a virtual camera / window capture for OBS
 *
 * For MVP: serves an HTML page with Live2D that OBS captures via Browser Source
 */

import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';


export interface AvatarConfig {
  /** Port for the avatar HTTP server */
  port?: number;
  /** Path to Live2D model directory */
  modelPath?: string;
  /** Background color (hex) */
  backgroundColor?: string;
  /** Avatar scale */
  scale?: number;
}

export class MoltAvatar {
  private config: Required<AvatarConfig>;
  private httpServer: ReturnType<typeof createServer> | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  constructor(config: AvatarConfig = {}) {
    this.config = {
      port: config.port ?? 3939,
      modelPath: config.modelPath ?? '',
      backgroundColor: config.backgroundColor ?? '#00FF00', // green screen
      scale: config.scale ?? 1.0,
    };
  }

  /** Start the avatar server (OBS Browser Source) */
  async start(): Promise<void> {
    this.httpServer = createServer(async (req, res) => {
      if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.generateAvatarHTML());
      } else if (req.url === '/crab.jpg' || req.url === '/crab-blink.jpg') {
        try {
          const filePath = join(__dirname, '..', 'public', req.url!.slice(1));
          const data = await readFile(filePath);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not Found');
        }
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`  🎭 Avatar client connected (${this.clients.size} total)`);

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    return new Promise((resolve) => {
      this.httpServer!.listen(this.config.port, () => {
        console.log(`\n  🎭 Avatar server running on http://localhost:${this.config.port}`);
        console.log(`  Add as OBS Browser Source: http://localhost:${this.config.port}\n`);
        resolve();
      });
    });
  }

  /** Stop the avatar server */
  stop(): void {
    for (const ws of this.clients) ws.close();
    this.clients.clear();
    this.wss?.close();
    this.httpServer?.close();
  }

  /** Send lip sync data (mouth open amount 0-1) */
  setMouthOpen(value: number): void {
    const msg = JSON.stringify({ type: 'mouth', value: Math.max(0, Math.min(1, value)) });
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  /** Send expression change */
  setExpression(expression: string): void {
    const msg = JSON.stringify({ type: 'expression', value: expression });
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  /** Send chat message to overlay */
  showChat(username: string, message: string): void {
    const msg = JSON.stringify({ type: 'chat', username, message });
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  /** Send bot response to overlay */
  showResponse(text: string): void {
    const msg = JSON.stringify({ type: 'response', text });
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  /** Send TTS audio (base64 encoded) to browser for playback */
  playAudio(audioBase64: string, mimeType: string = 'audio/mp3'): void {
    const msg = JSON.stringify({ type: 'audio', data: audioBase64, mime: mimeType });
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  /** Trigger speaking animation (auto lip sync from duration) */
  async speak(durationMs: number): Promise<void> {
    const fps = 30;
    const frames = Math.ceil((durationMs / 1000) * fps);

    for (let i = 0; i < frames; i++) {
      // Simulate natural mouth movement
      const t = i / frames;
      const base = Math.sin(t * Math.PI); // overall envelope
      const detail = Math.sin(i * 0.8) * 0.3 + Math.sin(i * 1.3) * 0.2; // mouth variation
      const mouth = Math.max(0, Math.min(1, base * 0.6 + detail * base));

      this.setMouthOpen(mouth);
      await sleep(1000 / fps);
    }

    this.setMouthOpen(0);
  }

  // --- Private ---

  private generateAvatarHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>MoltStream Avatar</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000000;
    font-family: 'Press Start 2P', monospace;
    color: white;
    image-rendering: pixelated;
  }

  .stream-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    height: 100vh;
    gap: 0;
  }

  /* --- Avatar + Bubble area (left) --- */
  .avatar-area {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    gap: 40px;
  }

  /* Crab container */
  .crab-wrap {
    position: relative;
    width: 800px;
    height: 800px;
    animation: idle 2.5s ease-in-out infinite;
  }
  .crab-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .crab-open { display: block; }
  .crab-blink { display: none; position: absolute; top: 0; left: 0; }

  /* Blink animation via JS — swap images */
  .crab-wrap.blinking .crab-open { display: none; }
  .crab-wrap.blinking .crab-blink { display: block; }

  @keyframes idle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  /* --- Pixel speech bubble --- */
  .pixel-bubble {
    position: relative;
    max-width: 500px;
    min-width: 280px;
    min-height: 100px;
    background: #000;
    border: 4px solid #FF2020;
    padding: 20px 24px;
    image-rendering: pixelated;
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 
      8px 0 0 0 #FF2020,
      -8px 0 0 0 #FF2020,
      0 8px 0 0 #FF2020,
      0 -8px 0 0 #FF2020;
  }
  .pixel-bubble.visible {
    opacity: 1;
    transform: scale(1);
  }
  /* Pixel tail pointing left */
  .pixel-bubble::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 30px;
    width: 0;
    height: 0;
    border: 10px solid transparent;
    border-right-color: #FF2020;
  }
  .pixel-bubble::after {
    content: '';
    position: absolute;
    left: -12px;
    top: 34px;
    width: 0;
    height: 0;
    border: 6px solid transparent;
    border-right-color: #000;
  }
  .pixel-bubble .label {
    font-size: 14px;
    color: #FF2020;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .pixel-bubble .text {
    font-size: 18px;
    line-height: 1.6;
    color: #fff;
    word-wrap: break-word;
  }

  /* Typing cursor */
  .typing-cursor {
    display: inline-block;
    width: 12px;
    height: 18px;
    background: #FF2020;
    animation: cursorBlink 0.6s step-end infinite;
    vertical-align: middle;
    margin-left: 2px;
  }
  @keyframes cursorBlink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  /* --- Chat panel (right) --- */
  .chat-panel {
    background: #0B0F14;
    border-left: 2px solid #FF2020;
    display: flex;
    flex-direction: column;
  }
  .chat-header {
    padding: 16px 18px;
    font-size: 14px;
    color: #FF2020;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 2px solid rgba(255,32,32,0.3);
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-thumb { background: #FF2020; }

  .chat-msg {
    padding: 10px 12px;
    font-size: 16px;
    line-height: 1.5;
    animation: chatIn 0.2s ease-out;
    border-left: 2px solid transparent;
  }
  .chat-msg .user {
    margin-right: 4px;
  }
  .chat-msg.viewer { border-left-color: #00FFFF; }
  .chat-msg.viewer .user { color: #00FFFF; }
  .chat-msg.bot { 
    border-left-color: #FF2020;
    background: rgba(255,32,32,0.08);
  }
  .chat-msg.bot .user { color: #FF2020; }
  .chat-msg .text { color: rgba(255,255,255,0.75); }

  @keyframes chatIn {
    from { opacity: 0; transform: translateX(8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* --- LIVE badge --- */
  .live-badge {
    position: fixed;
    top: 12px;
    left: 12px;
    background: #FF2020;
    color: #000;
    font-size: 14px;
    font-family: 'Press Start 2P', monospace;
    padding: 8px 16px;
    letter-spacing: 2px;
    animation: livePulse 1.5s step-end infinite;
    z-index: 100;
    border: 2px solid #fff;
  }
  @keyframes livePulse {
    0%, 60% { opacity: 1; }
    61%, 100% { opacity: 0.4; }
  }

  /* Scanlines */
  .scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 99;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px
    );
  }
</style>
</head>
<body>
  <div class="scanlines"></div>
  <div class="live-badge">● LIVE</div>

  <div class="stream-layout">
    <div class="avatar-area">
      <div class="crab-wrap" id="crab">
        <img class="crab-open" src="/crab.jpg" alt="crab" />
        <img class="crab-blink" src="/crab-blink.jpg" alt="crab blink" />
      </div>

      <div class="pixel-bubble" id="bubble">
        <div class="label">MOLTBOT &gt;</div>
        <div class="text" id="bubbleText"></div>
      </div>
    </div>

    <div class="chat-panel">
      <div class="chat-header">// LIVE_CHAT</div>
      <div class="chat-messages" id="chatMessages"></div>
    </div>
  </div>

  <script>
    const crab = document.getElementById('crab');
    const chatMessages = document.getElementById('chatMessages');
    const bubble = document.getElementById('bubble');
    const bubbleText = document.getElementById('bubbleText');
    let ws;
    let responseTimeout;
    let blinkInterval;

    // --- Blink ---
    function startBlink() {
      blinkInterval = setInterval(() => {
        crab.classList.add('blinking');
        setTimeout(() => crab.classList.remove('blinking'), 150);
      }, 3000 + Math.random() * 2000);
    }
    startBlink();

    function addChatMessage(username, message, isBot) {
      const el = document.createElement('div');
      el.className = 'chat-msg ' + (isBot ? 'bot' : 'viewer');
      el.innerHTML = '<span class="user">' + escapeHtml(username) + ':</span> <span class="text">' + escapeHtml(message) + '</span>';
      chatMessages.appendChild(el);
      while (chatMessages.children.length > 50) chatMessages.removeChild(chatMessages.firstChild);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showResponse(text) {
      // Typewriter effect
      bubble.classList.add('visible');
      bubbleText.innerHTML = '';
      let i = 0;
      const cursor = '<span class="typing-cursor"></span>';
      const type = () => {
        if (i < text.length) {
          bubbleText.innerHTML = escapeHtml(text.slice(0, i + 1)) + cursor;
          i++;
          setTimeout(type, 30 + Math.random() * 20);
        } else {
          bubbleText.innerHTML = escapeHtml(text);
        }
      };
      type();

      clearTimeout(responseTimeout);
      responseTimeout = setTimeout(() => {
        bubble.classList.remove('visible');
      }, 15000);
    }

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function connect() {
      ws = new WebSocket('ws://' + location.host);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === 'chat') {
          addChatMessage(data.username, data.message, false);
        }
        if (data.type === 'response') {
          addChatMessage('MOLTBOT', data.text, true);
          showResponse(data.text);
        }
        if (data.type === 'audio') {
          const audio = new Audio('data:' + data.mime + ';base64,' + data.data);
          audio.play().catch(() => {});
        }
      };
      ws.onclose = () => setTimeout(connect, 2000);
    }
    connect();
  </script>
</body>
</html>`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default MoltAvatar;
