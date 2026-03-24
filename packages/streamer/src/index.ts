/**
 * @moltstream/streamer
 * AI Streamer Agent — Day 1: Chat Bot with LLM
 *
 * Connects to Kick chat, processes messages through Claude,
 * and responds in character.
 */

import { KickChat, type KickChatMessage } from '@moltstream/kick-chat';
import { MoltTTS, type TTSConfig } from '@moltstream/tts';
import { MoltAvatar } from '@moltstream/avatar';
import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';

export interface StreamerConfig {
  /** Kick channel slug */
  channel: string;
  /** Kick chatroom ID (optional, auto-resolved) */
  chatroomId?: number;
  /** Kick auth token for sending messages */
  kickAuthToken?: string;
  /** Anthropic API key */
  anthropicApiKey: string;
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
}

interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

export class MoltStreamer extends EventEmitter {
  private chat: KickChat;
  private llm: Anthropic;
  private tts: MoltTTS | null = null;
  private avatar: MoltAvatar | null = null;
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
      anthropicApiKey: config.anthropicApiKey,
      personality: config.personality,
      agentName: config.agentName,
      model: config.model ?? 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens ?? 200,
      cooldownSeconds: config.cooldownSeconds ?? 3,
      minMessageLength: config.minMessageLength ?? 3,
      respondEveryN: config.respondEveryN ?? 1,
      tts: config.tts ?? { provider: 'fish', apiKey: '' },
      avatar: config.avatar ?? { enabled: false },
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

    this.chat = new KickChat({
      channel: this.config.channel,
      chatroomId: this.config.chatroomId || undefined,
      authToken: this.config.kickAuthToken || undefined,
      reconnect: true,
    });

    this.llm = new Anthropic({
      apiKey: this.config.anthropicApiKey,
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
    console.log(`  Model: ${this.config.model}`);
    console.log(`  Cooldown: ${this.config.cooldownSeconds}s`);
    console.log(`  Respond every: ${this.config.respondEveryN} messages`);
    if (this.tts) console.log(`  TTS: ${this.config.tts.provider}`);
    if (this.avatar) console.log(`  Avatar: enabled`);
    console.log('');

    // Start avatar server if configured
    if (this.avatar) {
      await this.avatar.start();
    }

    await this.chat.connect();
  }

  /** Stop the streamer agent */
  stop(): void {
    this.running = false;
    this.chat.disconnect();
    this.avatar?.stop();
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
      const response = await this.llm.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: this.config.personality,
        messages: this.conversation,
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      if (!text) return;

      // Add to conversation
      this.conversation.push({ role: 'assistant', content: text });

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
}

// --- Standalone runner ---

if (process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts')) {
  const channel = process.env.KICK_CHANNEL;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!channel || !apiKey) {
    console.error('\n  Usage: KICK_CHANNEL=<slug> ANTHROPIC_API_KEY=<key> node dist/index.js\n');
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
    anthropicApiKey: apiKey,
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
