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
import { fileURLToPath } from 'url';

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
  * { margin: 0; padding: 0; }
  body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: ${this.config.backgroundColor};
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #avatar {
    width: 400px;
    height: 600px;
    position: relative;
  }
  .avatar-body {
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at 50% 30%, #6366f1 0%, #4338ca 100%);
    border-radius: 50% 50% 45% 45%;
    position: relative;
    animation: idle 3s ease-in-out infinite;
  }
  .eyes {
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 40px;
  }
  .eye {
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    position: relative;
    animation: blink 4s ease-in-out infinite;
  }
  .eye::after {
    content: '';
    width: 12px;
    height: 12px;
    background: #1e1b4b;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .mouth {
    position: absolute;
    top: 55%;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 4px;
    background: #1e1b4b;
    border-radius: 10px;
    transition: height 0.05s ease, width 0.05s ease, border-radius 0.05s ease;
  }
  .mouth.open {
    height: 20px;
    width: 25px;
    border-radius: 50%;
  }
  @keyframes idle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  @keyframes blink {
    0%, 45%, 55%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.1); }
  }
  .status {
    position: fixed;
    bottom: 10px;
    right: 10px;
    font-family: monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    background: rgba(0,0,0,0.3);
    padding: 4px 8px;
  }
</style>
</head>
<body>
  <div id="avatar">
    <div class="avatar-body">
      <div class="eyes">
        <div class="eye"></div>
        <div class="eye"></div>
      </div>
      <div class="mouth" id="mouth"></div>
    </div>
  </div>
  <div class="status" id="status">connecting...</div>

  <script>
    const mouth = document.getElementById('mouth');
    const status = document.getElementById('status');
    let ws;

    function connect() {
      ws = new WebSocket('ws://' + location.host);

      ws.onopen = () => {
        status.textContent = 'connected';
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'mouth') {
          const v = data.value;
          if (v > 0.1) {
            mouth.classList.add('open');
            mouth.style.height = (4 + v * 20) + 'px';
            mouth.style.width = (20 + v * 10) + 'px';
          } else {
            mouth.classList.remove('open');
            mouth.style.height = '4px';
            mouth.style.width = '30px';
          }
        }
      };

      ws.onclose = () => {
        status.textContent = 'disconnected';
        setTimeout(connect, 2000);
      };
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
