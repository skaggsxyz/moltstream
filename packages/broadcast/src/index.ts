/**
 * @moltstream/broadcast
 * FFmpeg-based RTMP broadcaster — no OBS needed
 *
 * Takes the avatar HTML page (Browser Source) + audio and streams to Kick/Twitch via RTMP.
 * Falls back to a generated test card if no avatar is running.
 */

import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface BroadcastConfig {
  /** RTMP URL (e.g. rtmps://fa723fc1b171.global-contribute.live-video.net/) */
  rtmpUrl: string;
  /** Stream key */
  streamKey: string;
  /** Avatar server URL for browser capture (optional) */
  avatarUrl?: string;
  /** Resolution */
  width?: number;
  height?: number;
  /** FPS */
  fps?: number;
  /** Bitrate in kbps */
  bitrate?: number;
  /** Audio input file/device (optional) */
  audioInput?: string;
  /** Agent name for test card overlay */
  agentName?: string;
}

export class MoltBroadcast extends EventEmitter {
  private config: Required<BroadcastConfig>;
  private ffmpeg: ChildProcess | null = null;
  private running = false;

  constructor(config: BroadcastConfig) {
    super();
    this.config = {
      rtmpUrl: config.rtmpUrl,
      streamKey: config.streamKey,
      avatarUrl: config.avatarUrl ?? '',
      width: config.width ?? 1920,
      height: config.height ?? 1080,
      fps: config.fps ?? 30,
      bitrate: config.bitrate ?? 4500,
      audioInput: config.audioInput ?? '',
      agentName: config.agentName ?? 'MoltStream',
    };
  }

  /** Start broadcasting via FFmpeg */
  async start(): Promise<void> {
    // Check FFmpeg is available
    try {
      const check = spawn('ffmpeg', ['-version']);
      await new Promise<void>((resolve, reject) => {
        check.on('error', reject);
        check.on('close', (code) => code === 0 ? resolve() : reject(new Error('ffmpeg not found')));
      });
    } catch {
      throw new Error('FFmpeg is required but not installed. Install it: brew install ffmpeg');
    }

    const rtmpDest = `${this.config.rtmpUrl}${this.config.streamKey}`;
    const { width, height, fps, bitrate, agentName } = this.config;

    // Generate a test card with animated text overlay
    // lavfi generates video, we add text overlays
    const args: string[] = [
      // Input: generated test card
      '-f', 'lavfi',
      '-i', `color=c=0x0a0a0a:s=${width}x${height}:r=${fps},` +
        // Grid lines
        `drawgrid=w=60:h=60:t=1:c=0x1a1a1a@0.5,` +
        // Agent name - big centered
        `drawtext=text='${agentName}':fontsize=72:fontcolor=0xef4444:x=(w-text_w)/2:y=(h-text_h)/2-60:font=monospace,` +
        // Status line
        `drawtext=text='LIVE':fontsize=36:fontcolor=0x22c55e:x=(w-text_w)/2:y=(h/2)+20:font=monospace,` +
        // Timestamp
        `drawtext=text='%{localtime}':fontsize=24:fontcolor=0x666666:x=(w-text_w)/2:y=h-60:font=monospace,` +
        // Animated pulse dot
        `drawtext=text='●':fontsize=28:fontcolor=0xef4444:x=w/2-180:y=(h/2)+22:font=monospace`,

      // Silent audio (Kick requires audio track)
      '-f', 'lavfi',
      '-i', `anullsrc=channel_layout=stereo:sample_rate=44100`,

      // Video encoding
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-b:v', `${bitrate}k`,
      '-maxrate', `${bitrate}k`,
      '-bufsize', `${bitrate * 2}k`,
      '-pix_fmt', 'yuv420p',
      '-g', `${fps * 2}`, // keyframe every 2 seconds
      '-keyint_min', `${fps}`,

      // Audio encoding
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',

      // Output
      '-f', 'flv',
      '-flvflags', 'no_duration_filesize',
      rtmpDest,
    ];

    console.log(`\n  📡 Starting broadcast...`);
    console.log(`  Resolution: ${width}x${height} @ ${fps}fps`);
    console.log(`  Bitrate: ${bitrate}kbps`);
    console.log(`  RTMP: ${this.config.rtmpUrl.slice(0, 30)}...`);
    console.log(`  Agent: ${agentName}\n`);

    this.ffmpeg = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    this.running = true;

    this.ffmpeg.stderr?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      // Only log important lines
      if (line.includes('frame=') || line.includes('error') || line.includes('Error')) {
        // Emit frame stats periodically
        const frameMatch = line.match(/frame=\s*(\d+)/);
        if (frameMatch && parseInt(frameMatch[1]) % (fps * 10) === 0) {
          console.log(`  📡 ${line.slice(0, 80)}`);
        }
        if (line.toLowerCase().includes('error')) {
          console.error(`  ✗ FFmpeg: ${line}`);
          this.emit('error', new Error(line));
        }
      }
    });

    this.ffmpeg.on('close', (code) => {
      this.running = false;
      if (code !== 0 && code !== null) {
        console.error(`  ✗ FFmpeg exited with code ${code}`);
        this.emit('error', new Error(`FFmpeg exited with code ${code}`));
      }
      this.emit('stopped');
    });

    this.ffmpeg.on('error', (err) => {
      this.emit('error', err);
    });

    // Wait a moment to check it didn't crash immediately
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 3000);
      this.ffmpeg?.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) reject(new Error(`FFmpeg failed to start (code ${code})`));
      });
    });

    console.log(`  📡 Broadcasting LIVE to ${this.config.rtmpUrl.includes('kick') ? 'Kick' : 'RTMP'}`);
    this.emit('live');
  }

  /** Stop broadcasting */
  stop(): void {
    if (this.ffmpeg) {
      this.ffmpeg.kill('SIGTERM');
      this.ffmpeg = null;
    }
    this.running = false;
    console.log(`\n  ■ Broadcast stopped.\n`);
  }

  get isLive(): boolean {
    return this.running;
  }
}

export default MoltBroadcast;
