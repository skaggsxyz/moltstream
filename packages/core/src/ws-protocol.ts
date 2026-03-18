/**
 * WebSocket Streaming Protocol
 *
 * Defines the wire protocol for real-time agent state streaming.
 * Clients connect via WS and receive typed frames representing
 * scene transitions, reasoning traces, memory writes, and audience signals.
 */

export enum FrameType {
  /** Agent scene transition */
  SCENE = 'scene',
  /** Reasoning trace (step-by-step thought) */
  REASON = 'reason',
  /** Memory write event */
  MEMORY = 'memory',
  /** Audience signal (chat, reaction, etc.) */
  AUDIENCE = 'audience',
  /** Telemetry / heartbeat */
  HEARTBEAT = 'heartbeat',
  /** Error frame */
  ERROR = 'error',
}

export interface Frame<T = unknown> {
  type: FrameType;
  ts: number;
  seq: number;
  sessionId: string;
  payload: T;
}

export interface ScenePayload {
  from: string;
  to: string;
  trigger: string;
  metadata?: Record<string, unknown>;
}

export interface ReasonPayload {
  engine: string;
  input: string;
  output: string;
  confidence: number;
  durationMs: number;
  traceId: string;
}

export interface MemoryPayload {
  key: string;
  value: unknown;
  operation: 'set' | 'delete' | 'expire';
  ttlMs?: number;
}

export interface AudiencePayload {
  source: string;
  user: string;
  message: string;
  sentiment?: number;
  platform: string;
}

export interface HeartbeatPayload {
  uptime: number;
  fps: number;
  memoryUsage: number;
  activeConnections: number;
}

/**
 * Frame serialiser — encodes frames as JSON with optional binary packing.
 */
export class FrameCodec {
  private seq = 0;

  constructor(private sessionId: string) {}

  encode<T>(type: FrameType, payload: T): string {
    const frame: Frame<T> = {
      type,
      ts: Date.now(),
      seq: this.seq++,
      sessionId: this.sessionId,
      payload,
    };
    return JSON.stringify(frame);
  }

  decode<T = unknown>(raw: string): Frame<T> {
    const frame = JSON.parse(raw) as Frame<T>;
    if (!frame.type || frame.seq === undefined) {
      throw new Error('Invalid frame: missing type or seq');
    }
    return frame;
  }

  reset(): void {
    this.seq = 0;
  }
}

/**
 * Connection manager — tracks active WS connections and broadcasts frames.
 */
export interface WSConnection {
  id: string;
  send: (data: string) => void;
  close: () => void;
  readyState: number;
}

export class ConnectionPool {
  private connections = new Map<string, WSConnection>();

  add(conn: WSConnection): void {
    this.connections.set(conn.id, conn);
  }

  remove(id: string): void {
    this.connections.delete(id);
  }

  broadcast(data: string): void {
    for (const conn of this.connections.values()) {
      if (conn.readyState === 1) {
        conn.send(data);
      }
    }
  }

  get size(): number {
    return this.connections.size;
  }

  getConnection(id: string): WSConnection | undefined {
    return this.connections.get(id);
  }

  disconnectAll(): void {
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
  }
}
