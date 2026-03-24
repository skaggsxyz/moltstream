/**
 * @moltstream/streamer
 * AI Streamer Agent — Chat Bot with LLM
 *
 * Connects to Kick chat, processes messages through LLM (Gemini or Claude),
 * and responds in character.
 */

import { KickChat, type KickChatMessage } from '@moltstream/kick-chat';
import { MoltTTS, type TTSConfig } from '@moltstream/tts';
import { MoltAvatar } from '@moltstream/avatar';
import { MoltBroadcast } from '@moltstream/broadcast';
import { EventEmitter } from 'events';

export interface StreamerConfig {
  /** Kick channel slug */
  channel: string;
  /** Kick chatroom ID (optional, auto-resolved) */
  chatroomId?: number;
  /** Kick auth token for sending messages */
  kickAuthToken?: string;
  /** LLM provider */
  llmProvider?: 'gemini' | 'anthropic';
  /** LLM API key (Gemini or Anthropic) */
  apiKey: string;
  /** Agent personality system prompt */
  personality: string;
  /** Agent name (displayed in logs) */
  agentName: string;
  /** Model to use */
  model?: string;
  /** Max tokens per response */
  maxTokens?: number;
  /** Minimum seconds between responses (rate limit) */
  cooldownSeconds?: number;
  /** Ignore messages shorter than this */
  minMessageLength?: number;
  /** Respond to every Nth message (1 = all, 3 = every 3rd) */
  respondEveryN?: number;
  /** TTS configuration (optional — enables voice) */
  tts?: {
    provider: TTSConfig['provider'];
    apiKey: string;
    voice?: string;
  };
  /** Enable avatar server (OBS Browser Source) */
  avatar?: {
    enabled: boolean;
    port?: number;
    backgroundColor?: string;
  };
  /** Broadcast config (FFmpeg RTMP — no OBS needed) */
  broadcast?: {
    enabled: boolean;
    rtmpUrl: string;
    streamKey: string;
    width?: number;
    height?: number;
    fps?: number;
    bitrate?: number;
  };
}

interface ConversationEntry {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export class MoltStreamer extends EventEmitter {
  private chat: KickChat;
  private tts: MoltTTS | null = null;
  private avatar: MoltAvatar | null = null;
  private broadcast: MoltBroadcast | null = null;
  private config: Required<StreamerConfig>;
  private conversation: ConversationEntry[] = [];
  private lastResponseTime = 0;
  private messageCount = 0;
  private running = false;

  constructor(config: StreamerConfig) {
    super();
    this.config = {
      channel: config.channel,
      chatroomId: config.chatroomId ?? 0,
      kickAuthToken: config.kickAuthToken ?? '',
      llmProvider: config.llmProvider ?? 'gemini',
      apiKey: config.apiKey,
      personality: config.personality,
      agentName: config.agentName,
      model: config.model ?? (config.llmProvider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gemini-2.0-flash'),
      maxTokens: config.maxTokens ?? 200,
      cooldownSeconds: config.cooldownSeconds ?? 3,
      minMessageLength: config.minMessageLength ?? 3,
      respondEveryN: config.respondEveryN ?? 1,
      tts: config.tts ?? { provider: 'fish', apiKey: '' },
      avatar: config.avatar ?? { enabled: false },
      broadcast: config.broadcast ?? { enabled: false, rtmpUrl: '', streamKey: '' },
    };

    // Init TTS if configured
    if (config.tts?.apiKey) {
      this.tts = new MoltTTS({
        provider: config.tts.provider,
        apiKey: config.tts.apiKey,
        voice: config.tts.voice,
      });

      this.tts.on('generating', (info: any) => {
        console.log(`  🔊 Generating speech (${info.provider})...`);
      });

      this.tts.on('generated', (result: any) => {
        console.log(`  🔊 Audio: ${result.filePath} (~${result.durationEstimate.toFixed(1)}s)`);
      });
    }

    // Init Avatar if configured
    if (config.avatar?.enabled) {
      this.avatar = new MoltAvatar({
        port: config.avatar.port ?? 3939,
        backgroundColor: config.avatar.backgroundColor ?? '#00FF00',
      });
    }

    // Init Broadcast if configured
    if (config.broadcast?.enabled && config.broadcast.rtmpUrl && config.broadcast.streamKey) {
      this.broadcast = new MoltBroadcast({
        rtmpUrl: config.broadcast.rtmpUrl,
        streamKey: config.broadcast.streamKey,
        avatarUrl: `http://localhost:${this.config.avatar.port}`,
        width: config.broadcast.width,
        height: config.broadcast.height,
        fps: config.broadcast.fps,
        bitrate: config.broadcast.bitrate,
        agentName: this.config.agentName,
      });

      this.broadcast.on('live', () => {
        console.log(`  📡 MoltStream is LIVE!`);
      });

      this.broadcast.on('error', (err: Error) => {
        console.error(`  ✗ Broadcast error:`, err.message);
      });
    }

    this.chat = new KickChat({
      channel: this.config.channel,
      chatroomId: this.config.chatroomId || undefined,
      authToken: this.config.kickAuthToken || undefined,
      reconnect: true,
    });
  }

  /** Start the streamer agent */
  async start(): Promise<void> {
    this.running = true;

    this.chat.on('connected', (info: any) => {
      console.log(`\n  ⚡ ${this.config.agentName} connected to Kick chat`);
      console.log(`  Channel: ${this.config.channel}`);
      console.log(`  Chatroom: ${info.chatroomId}\n`);
    });

    this.chat.on('message', (msg: KickChatMessage) => {
      this.handleMessage(msg).catch((err) => {
        console.error(`  ✗ Error handling message:`, err.message);
      });
    });

    this.chat.on('error', (err: Error) => {
      console.error(`  ✗ Chat error:`, err.message);
    });

    this.chat.on('disconnected', () => {
      console.log(`  ⚠ Disconnected from chat, reconnecting...`);
    });

    this.chat.on('debug', (msg: string) => {
      console.log(`  [debug] ${msg}`);
    });

    console.log(`\n  🔴 Starting ${this.config.agentName}...`);
    console.log(`  LLM: ${this.config.llmProvider} (${this.config.model})`);
    console.log(`  Cooldown: ${this.config.cooldownSeconds}s`);
    console.log(`  Respond every: ${this.config.respondEveryN} messages`);
    if (this.tts) console.log(`  TTS: ${this.config.tts.provider}`);
    if (this.avatar) console.log(`  Avatar: enabled`);
    if (this.broadcast) console.log(`  Broadcast: enabled`);
    console.log('');

    // Start avatar server if configured
    if (this.avatar) {
      await this.avatar.start();
    }

    // Start broadcast if configured
    if (this.broadcast) {
      await this.broadcast.start();
    }

    await this.chat.connect();
  }

  /** Stop the streamer agent */
  stop(): void {
    this.running = false;
    this.chat.disconnect();
    this.avatar?.stop();
    this.broadcast?.stop();
    console.log(`\n  ■ ${this.config.agentName} stopped.\n`);
  }

  // --- Private ---

  private async handleMessage(msg: KickChatMessage): Promise<void> {
    if (!this.running) return;

    // Skip short messages
    if (msg.content.length < this.config.minMessageLength) return;

    // Skip bot's own messages
    if (msg.sender.username.toLowerCase() === this.config.agentName.toLowerCase()) return;

    // Rate limit
    this.messageCount++;
    if (this.messageCount % this.config.respondEveryN !== 0) return;

    const now = Date.now();
    const elapsed = (now - this.lastResponseTime) / 1000;
    if (elapsed < this.config.cooldownSeconds) return;

    console.log(`  💬 ${msg.sender.username}: ${msg.content}`);

    // Build conversation context
    this.conversation.push({
      role: 'user',
      content: `[${msg.sender.username}]: ${msg.content}`,
    });

    // Keep last 20 messages for context
    if (this.conversation.length > 20) {
      this.conversation = this.conversation.slice(-20);
    }

    try {
      let text: string;

      if (this.config.llmProvider === 'gemini') {
        text = await this.callGemini();
      } else {
        text = await this.callAnthropic();
      }

      if (!text) return;

      // Add to conversation
      this.conversation.push({ role: this.config.llmProvider === 'gemini' ? 'model' : 'assistant', content: text });

      console.log(`  🤖 ${this.config.agentName}: ${text}`);

      // Generate speech if TTS is configured
      if (this.tts) {
        try {
          const audio = await this.tts.speak(text);
          this.emit('audio', audio);

          // Trigger avatar lip sync
          if (this.avatar) {
            this.avatar.speak(audio.durationEstimate * 1000).catch(() => {});
          }
        } catch (ttsErr: any) {
          console.error(`  ✗ TTS error:`, ttsErr.message);
        }
      }

      // Send to Kick chat
      if (this.config.kickAuthToken) {
        await this.chat.sendMessage(text);
      }

      this.lastResponseTime = Date.now();
    } catch (err: any) {
      console.error(`  ✗ LLM error:`, err.message);
    }
  }

  private async callGemini(): Promise<string> {
    const { fetch } = await import('undici');

    const contents = this.conversation.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: this.config.personality }] },
          contents,
          generationConfig: {
            maxOutputTokens: this.config.maxTokens,
            temperature: 0.9,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  private async callAnthropic(): Promise<string> {
    const { fetch } = await import('undici');

    const messages = this.conversation.map((msg) => ({
      role: msg.role === 'model' ? 'assistant' as const : msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: this.config.personality,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = await res.json() as any;
    return data?.content?.[0]?.text ?? '';
  }
}

// --- Standalone runner ---

if (process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts')) {
  const channel = process.env.KICK_CHANNEL;
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const llmProvider = (process.env.LLM_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'anthropic')) as 'gemini' | 'anthropic';

  const chatroomId = process.env.KICK_CHATROOM_ID ? Number(process.env.KICK_CHATROOM_ID) : undefined;

  if (!channel || !apiKey) {
    console.error('\n  Usage: KICK_CHANNEL=<slug> GEMINI_API_KEY=<key> node dist/index.js\n');
    process.exit(1);
  }

  // TTS config from env
  const ttsProvider = process.env.TTS_PROVIDER as 'fish' | 'elevenlabs' | 'openai' | undefined;
  const ttsApiKey = process.env.TTS_API_KEY;
  const ttsConfig = ttsProvider && ttsApiKey ? {
    provider: ttsProvider,
    apiKey: ttsApiKey,
    voice: process.env.TTS_VOICE,
  } : undefined;

  const streamer = new MoltStreamer({
    channel,
    chatroomId,
    llmProvider,
    apiKey,
    kickAuthToken: process.env.KICK_AUTH_TOKEN,
    agentName: process.env.AGENT_NAME ?? 'MoltBot',
    personality: process.env.AGENT_PERSONALITY ?? `You are a friendly, witty AI streamer assistant. You interact with chat viewers in a fun and engaging way. Keep responses short (1-2 sentences), casual, and entertaining. You have a playful personality and love gaming, tech, and internet culture. Never break character.`,
    cooldownSeconds: Number(process.env.COOLDOWN_SECONDS ?? '5'),
    respondEveryN: Number(process.env.RESPOND_EVERY_N ?? '1'),
    tts: ttsConfig,
    avatar: process.env.AVATAR_ENABLED === 'true' ? {
      enabled: true,
      port: Number(process.env.AVATAR_PORT ?? '3939'),
      backgroundColor: process.env.AVATAR_BG ?? '#00FF00',
    } : undefined,
    broadcast: process.env.BROADCAST_ENABLED === 'true' ? {
      enabled: true,
      rtmpUrl: process.env.RTMP_URL || '',
      streamKey: process.env.STREAM_KEY || '',
      width: Number(process.env.BROADCAST_WIDTH ?? '1920'),
      height: Number(process.env.BROADCAST_HEIGHT ?? '1080'),
      fps: Number(process.env.BROADCAST_FPS ?? '30'),
      bitrate: Number(process.env.BROADCAST_BITRATE ?? '4500'),
    } : undefined,
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    streamer.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    streamer.stop();
    process.exit(0);
  });

  streamer.start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}

export default MoltStreamer;
