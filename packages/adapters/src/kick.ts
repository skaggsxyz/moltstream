import type { PlatformAdapter, AdapterCallbacks } from './types.js';

export interface KickConfig {
  streamKey: string;
  channelSlug?: string;
}

export class KickAdapter implements PlatformAdapter {
  readonly platform = 'kick';
  private config: KickConfig;
  private callbacks: AdapterCallbacks | null = null;
  private live = false;

  constructor(config: KickConfig) {
    this.config = config;
  }

  async connect(callbacks: AdapterCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.live = true;
    // Kick Pusher WebSocket connection
  }

  async disconnect(): Promise<void> {
    this.live = false;
    this.callbacks = null;
  }

  async sendChat(message: string): Promise<void> {
    if (!this.live) throw new Error('Not connected');
    // Kick chat API
  }

  async getViewerCount(): Promise<number> {
    return 0;
  }

  isLive(): boolean {
    return this.live;
  }
}
