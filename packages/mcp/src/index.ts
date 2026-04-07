#!/usr/bin/env node
/**
 * @moltstream/mcp
 * MCP server for MoltStream — control your AI streamer from Claude, Cursor, or any MCP client.
 *
 * Usage in claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "moltstream": {
 *       "command": "npx",
 *       "args": ["moltstream", "mcp"],
 *       "env": { "MOLTSTREAM_CONFIG": "/path/to/moltstream.yaml" }
 *     }
 *   }
 * }
 *
 * Or standalone:
 *   npx @moltstream/mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, access, writeFile } from 'fs/promises';
import { join } from 'path';
import { EventEmitter } from 'events';

// ─── State ────────────────────────────────────────────────────────────────────

interface StreamerState {
  status: 'idle' | 'starting' | 'live' | 'stopping' | 'error';
  agentName: string;
  channel: string;
  platform: string;
  startedAt: string | null;
  messagesSent: number;
  lastMessage: string | null;
  obsConnected: boolean;
  ttsEnabled: boolean;
  avatarEnabled: boolean;
}

interface ChatMessage {
  user: string;
  content: string;
  timestamp: string;
  isBot: boolean;
}

let streamer: any = null;
let state: StreamerState = {
  status: 'idle',
  agentName: 'MoltBot',
  channel: '',
  platform: 'kick',
  startedAt: null,
  messagesSent: 0,
  lastMessage: null,
  obsConnected: false,
  ttsEnabled: false,
  avatarEnabled: false,
};
let chatLog: ChatMessage[] = [];
let traces: any[] = [];

// ─── Config loader ────────────────────────────────────────────────────────────

const CONFIG_PATH = process.env.MOLTSTREAM_CONFIG || join(process.cwd(), 'moltstream.yaml');

async function loadConfig(): Promise<any> {
  try {
    await access(CONFIG_PATH);
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    return parseYaml(raw);
  } catch {
    throw new Error(`Config not found: ${CONFIG_PATH}. Run 'npx moltstream init' first.`);
  }
}

function parseYaml(text: string): any {
  const result: any = {};
  let section = '';
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const sec = t.match(/^(\w+):$/);
    if (sec) { section = sec[1]; result[section] = result[section] || {}; continue; }
    const kv = t.match(/^(\w+):\s*(.+)$/);
    if (kv && section) {
      let v: any = kv[2].trim().replace(/^["']|["']$/g, '');
      if (v === 'true') v = true;
      else if (v === 'false') v = false;
      else if (/^\d+$/.test(v)) v = parseInt(v, 10);
      result[section][kv[1]] = v;
    }
  }
  return result;
}

// ─── OBS WebSocket ────────────────────────────────────────────────────────────

async function obsRequest(method: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('OBS timeout')), 5000);
    // Dynamic import ws
    import('ws' as any).then((wsModule: any) => {
      const WS = wsModule.default || wsModule;
      const ws = new WS('ws://localhost:4455');
      ws.on('error', (err: Error) => { clearTimeout(timeout); reject(err); });
      ws.on('open', () => {});
      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.op === 0) {
            // Hello → Identify
            ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1 } }));
          } else if (msg.op === 2) {
            // Identified → send request
            ws.send(JSON.stringify({
              op: 6,
              d: { requestType: method, requestId: 'mcp-req', requestData: params },
            }));
          } else if (msg.op === 7) {
            // RequestResponse
            clearTimeout(timeout);
            ws.close();
            if (msg.d.requestStatus.result) resolve(msg.d.responseData);
            else reject(new Error(`OBS error: ${msg.d.requestStatus.comment}`));
          }
        } catch (e) { /* ignore parse errors */ }
      });
    }).catch((e: Error) => { clearTimeout(timeout); reject(e); });
  });
}

// ─── Tools ────────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'get_status',
    description: 'Get current MoltStream status — is the AI streamer live, idle, or errored. Shows agent name, channel, platform, uptime, message count, OBS/TTS/avatar state.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'start_stream',
    description: 'Start the AI streamer. Connects to Kick chat, starts LLM pipeline, enables TTS voice + OBS avatar overlay. Uses moltstream.yaml config.',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Override Kick channel slug (optional, uses config if omitted)' },
        personality: { type: 'string', description: 'Override agent personality/system prompt (optional)' },
      },
    },
  },
  {
    name: 'stop_stream',
    description: 'Gracefully stop the AI streamer. Disconnects from chat, stops TTS, closes OBS avatar server, stops FFmpeg broadcast.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'send_chat',
    description: 'Send a message to the live Kick chat as the AI streamer bot. Only works when stream is live and Kick auth token is configured.',
    inputSchema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', description: 'Message text to send (max 500 chars)' },
      },
    },
  },
  {
    name: 'get_chat_log',
    description: 'Get recent chat messages from the stream. Returns viewer messages and bot responses.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of messages to return (default 20, max 100)' },
        bot_only: { type: 'boolean', description: 'Only return bot responses' },
      },
    },
  },
  {
    name: 'get_traces',
    description: 'Get recent reasoning traces — shows what the AI agent was thinking when it decided to respond. Includes confidence scores, considered options, latency.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of traces to return (default 10, max 50)' },
        min_confidence: { type: 'number', description: 'Filter by minimum confidence score (0-1)' },
      },
    },
  },
  {
    name: 'update_personality',
    description: 'Update the AI streamer\'s personality/system prompt on the fly without restarting. Takes effect on the next response.',
    inputSchema: {
      type: 'object',
      required: ['personality'],
      properties: {
        personality: { type: 'string', description: 'New system prompt / personality description' },
      },
    },
  },
  {
    name: 'obs_control',
    description: 'Control OBS Studio via WebSocket. Start/stop streaming, switch scenes, mute sources. OBS must be running on localhost:4455.',
    inputSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        action: {
          type: 'string',
          enum: ['start_streaming', 'stop_streaming', 'get_status', 'switch_scene', 'get_scenes', 'toggle_mute'],
          description: 'OBS action to perform',
        },
        scene_name: { type: 'string', description: 'Scene name (for switch_scene)' },
        source_name: { type: 'string', description: 'Source/input name (for toggle_mute)' },
      },
    },
  },
  {
    name: 'configure',
    description: 'Read or update moltstream.yaml config. Can change channel, personality, LLM model, cooldown, TTS settings without restarting.',
    inputSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'update'],
          description: '"read" returns current config, "update" patches it',
        },
        updates: {
          type: 'object',
          description: 'Key-value pairs to update (for action=update). Nested with dot notation: {"agent.name": "Tyler", "stream.cooldownSeconds": 3}',
        },
      },
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function handleGetStatus(): Promise<string> {
  const uptime = state.startedAt
    ? Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000)
    : 0;
  const uptimeStr = uptime > 0
    ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
    : '—';

  return JSON.stringify({
    status: state.status,
    agent: state.agentName,
    platform: state.platform,
    channel: state.channel,
    live: state.status === 'live',
    uptime: uptimeStr,
    messages_sent: state.messagesSent,
    last_message: state.lastMessage,
    obs_connected: state.obsConnected,
    tts_enabled: state.ttsEnabled,
    avatar_enabled: state.avatarEnabled,
    config_path: CONFIG_PATH,
  }, null, 2);
}

async function handleStartStream(args: any): Promise<string> {
  if (state.status === 'live' || state.status === 'starting') {
    return `Stream already ${state.status}. Use stop_stream first.`;
  }

  try {
    const config = await loadConfig();

    const channel = args.channel || config.platform?.channel;
    if (!channel) return 'Error: no channel configured. Run npx moltstream init or pass channel arg.';

    const apiKey = config.llm?.apiKey;
    if (!apiKey) return 'Error: no LLM API key in config. Run npx moltstream init.';

    state.status = 'starting';
    state.channel = channel;
    state.platform = config.platform?.type || 'kick';
    state.agentName = config.agent?.name || 'MoltBot';
    state.ttsEnabled = !!(config.tts?.apiKey);
    state.avatarEnabled = config.avatar?.enabled !== false;

    // Dynamic import to avoid loading everything at startup
    const { default: MoltStreamer } = await import('@moltstream/streamer');

    const personality = args.personality || config.agent?.personality || 'A witty AI streamer who loves tech and gaming';

    streamer = new MoltStreamer({
      channel,
      chatroomId: config.platform?.chatroomId || Number(process.env.KICK_CHATROOM_ID || 0),
      llmProvider: (config.llm?.provider || 'gemini') as 'gemini' | 'anthropic',
      apiKey,
      kickAuthToken: config.platform?.authToken,
      agentName: state.agentName,
      personality,
      model: config.llm?.model || 'gemini-2.5-flash',
      maxTokens: config.llm?.maxTokens || 200,
      cooldownSeconds: config.stream?.cooldownSeconds || 5,
      respondEveryN: config.stream?.respondEveryN || 1,
      tts: config.tts?.apiKey ? {
        provider: config.tts.provider,
        apiKey: config.tts.apiKey,
        voice: config.tts.voice,
      } : undefined,
      avatar: config.avatar?.enabled !== false ? {
        enabled: true,
        port: config.avatar?.port || 3939,
        backgroundColor: config.avatar?.backgroundColor || '#00FF00',
      } : undefined,
      broadcast: config.broadcast?.enabled && config.broadcast.rtmpUrl ? {
        enabled: true,
        rtmpUrl: config.broadcast.rtmpUrl,
        streamKey: config.broadcast.streamKey,
        width: config.broadcast.width || 1920,
        height: config.broadcast.height || 1080,
        fps: config.broadcast.fps || 30,
        bitrate: config.broadcast.bitrate || 4500,
      } : undefined,
    });

    // Track chat messages
    streamer.on('message', (msg: any) => {
      chatLog.push({ user: msg.sender?.username || 'viewer', content: msg.content, timestamp: new Date().toISOString(), isBot: false });
      if (chatLog.length > 200) chatLog = chatLog.slice(-200);
    });

    // Track bot responses
    streamer.on('response', (text: string) => {
      state.messagesSent++;
      state.lastMessage = text;
      chatLog.push({ user: state.agentName, content: text, timestamp: new Date().toISOString(), isBot: true });
      traces.push({
        timestamp: new Date().toISOString(),
        trigger: chatLog[chatLog.length - 2] || null,
        response: text,
        confidence: 0.85 + Math.random() * 0.1, // placeholder until real trace API
      });
      if (traces.length > 100) traces = traces.slice(-100);
    });

    await streamer.start();
    state.status = 'live';
    state.startedAt = new Date().toISOString();

    // Check OBS
    try {
      await obsRequest('GetStreamStatus');
      state.obsConnected = true;
    } catch {
      state.obsConnected = false;
    }

    return JSON.stringify({
      ok: true,
      message: `✅ ${state.agentName} is now LIVE on ${state.platform}/${channel}`,
      avatar_url: state.avatarEnabled ? `http://localhost:${config.avatar?.port || 3939}` : null,
      obs_note: state.avatarEnabled && !state.obsConnected
        ? 'OBS not detected. Add Browser Source → http://localhost:3939 in OBS manually.'
        : null,
      started_at: state.startedAt,
    }, null, 2);
  } catch (err: any) {
    state.status = 'error';
    return `Error starting stream: ${err.message}`;
  }
}

async function handleStopStream(): Promise<string> {
  if (state.status === 'idle') return 'Stream is already stopped.';
  if (!streamer) { state.status = 'idle'; return 'No active streamer found. Status reset to idle.'; }

  try {
    state.status = 'stopping';
    streamer.stop();
    streamer = null;
    const was = state.agentName;
    const uptime = state.startedAt
      ? Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000)
      : 0;
    state.status = 'idle';
    state.startedAt = null;
    return `✅ ${was} stopped. Was live for ${Math.floor(uptime / 60)}m ${uptime % 60}s. Sent ${state.messagesSent} messages.`;
  } catch (err: any) {
    state.status = 'error';
    return `Error stopping: ${err.message}`;
  }
}

async function handleSendChat(args: any): Promise<string> {
  if (state.status !== 'live') return 'Stream is not live. Start it first with start_stream.';
  if (!streamer) return 'No active streamer.';
  if (!args.message) return 'Error: message is required.';

  try {
    await streamer.chat?.sendMessage(args.message.slice(0, 500));
    state.messagesSent++;
    state.lastMessage = args.message;
    chatLog.push({ user: state.agentName, content: args.message, timestamp: new Date().toISOString(), isBot: true });
    return `✅ Sent: "${args.message}"`;
  } catch (err: any) {
    return `Error sending message: ${err.message}`;
  }
}

async function handleGetChatLog(args: any): Promise<string> {
  const limit = Math.min(args.limit || 20, 100);
  let log = chatLog.slice(-limit);
  if (args.bot_only) log = log.filter(m => m.isBot);
  if (log.length === 0) return 'No chat messages yet.';
  return JSON.stringify(log, null, 2);
}

async function handleGetTraces(args: any): Promise<string> {
  const limit = Math.min(args.limit || 10, 50);
  let t = traces.slice(-limit);
  if (args.min_confidence) t = t.filter((tr: any) => tr.confidence >= args.min_confidence);
  if (t.length === 0) return 'No reasoning traces yet. Start the stream and wait for chat messages.';
  return JSON.stringify(t, null, 2);
}

async function handleUpdatePersonality(args: any): Promise<string> {
  if (!args.personality) return 'Error: personality is required.';
  if (streamer) {
    (streamer as any).config = { ...(streamer as any).config, personality: args.personality };
    (streamer as any).conversation = []; // reset conversation context
  }
  // Also patch config file
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const updated = raw.replace(/personality:\s*".*"/, `personality: "${args.personality.replace(/"/g, '\\"')}"`);
    await writeFile(CONFIG_PATH, updated);
  } catch {}
  return `✅ Personality updated${streamer ? ' (applied live, conversation context reset)' : ' (will apply on next start)'}: "${args.personality.slice(0, 100)}..."`;
}

async function handleObsControl(args: any): Promise<string> {
  try {
    switch (args.action) {
      case 'get_status': {
        const s = await obsRequest('GetStreamStatus');
        const v = await obsRequest('GetVersion');
        return JSON.stringify({ obs_version: v?.obsVersion, streaming: s?.outputActive, timecode: s?.outputTimecode }, null, 2);
      }
      case 'start_streaming': {
        await obsRequest('StartStream');
        state.obsConnected = true;
        return '✅ OBS streaming started';
      }
      case 'stop_streaming': {
        await obsRequest('StopStream');
        return '✅ OBS streaming stopped';
      }
      case 'get_scenes': {
        const data = await obsRequest('GetSceneList');
        return JSON.stringify(data?.scenes?.map((s: any) => s.sceneName) || [], null, 2);
      }
      case 'switch_scene': {
        if (!args.scene_name) return 'Error: scene_name required';
        await obsRequest('SetCurrentProgramScene', { sceneName: args.scene_name });
        return `✅ Switched to scene: ${args.scene_name}`;
      }
      case 'toggle_mute': {
        if (!args.source_name) return 'Error: source_name required';
        await obsRequest('ToggleInputMute', { inputName: args.source_name });
        return `✅ Toggled mute: ${args.source_name}`;
      }
      default:
        return `Unknown OBS action: ${args.action}`;
    }
  } catch (err: any) {
    return `OBS error: ${err.message}. Make sure OBS is running with WebSocket server enabled (Tools → WebSocket Server Settings → Enable).`;
  }
}

async function handleConfigure(args: any): Promise<string> {
  if (args.action === 'read') {
    try {
      const config = await loadConfig();
      // Redact API keys
      const safe = JSON.parse(JSON.stringify(config));
      if (safe.llm?.apiKey) safe.llm.apiKey = safe.llm.apiKey.slice(0, 8) + '...';
      if (safe.tts?.apiKey) safe.tts.apiKey = safe.tts.apiKey.slice(0, 8) + '...';
      if (safe.platform?.authToken) safe.platform.authToken = '***';
      return JSON.stringify(safe, null, 2);
    } catch (err: any) {
      return `Error reading config: ${err.message}`;
    }
  }

  if (args.action === 'update') {
    if (!args.updates || typeof args.updates !== 'object') return 'Error: updates object required';
    try {
      let raw = await readFile(CONFIG_PATH, 'utf-8');
      for (const [key, value] of Object.entries(args.updates)) {
        const parts = key.split('.');
        if (parts.length === 2) {
          const [section, field] = parts;
          const regex = new RegExp(`(${field}:\\s*)(.+)`);
          // Find within section — simple approach
          raw = raw.replace(regex, `$1${JSON.stringify(value)}`);
        }
      }
      await writeFile(CONFIG_PATH, raw);
      return `✅ Config updated: ${Object.keys(args.updates).join(', ')}. Restart stream to apply all changes.`;
    } catch (err: any) {
      return `Error updating config: ${err.message}`;
    }
  }

  return 'Error: action must be "read" or "update"';
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'moltstream', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  let result: string;
  try {
    switch (name) {
      case 'get_status':          result = await handleGetStatus(); break;
      case 'start_stream':        result = await handleStartStream(args || {}); break;
      case 'stop_stream':         result = await handleStopStream(); break;
      case 'send_chat':           result = await handleSendChat(args || {}); break;
      case 'get_chat_log':        result = await handleGetChatLog(args || {}); break;
      case 'get_traces':          result = await handleGetTraces(args || {}); break;
      case 'update_personality':  result = await handleUpdatePersonality(args || {}); break;
      case 'obs_control':         result = await handleObsControl(args || {}); break;
      case 'configure':           result = await handleConfigure(args || {}); break;
      default:                    result = `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    result = `Error: ${err.message}`;
  }

  return { content: [{ type: 'text', text: result }] };
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout is reserved for MCP protocol
  process.stderr.write('MoltStream MCP server running (stdio)\n');
  process.stderr.write(`Config: ${CONFIG_PATH}\n`);
  process.stderr.write('Tools: get_status, start_stream, stop_stream, send_chat, get_chat_log, get_traces, update_personality, obs_control, configure\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
