import type { ContainerConfig, ContainerState, AgentContainer, ContainerEvent } from './types';
import { DEFAULT_CONTAINER_CONFIG } from './types';
import { EventEmitter } from 'events';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * ContainerRuntime manages the lifecycle of a single agent container.
 * Wraps Docker CLI for portability — no Docker SDK dependency.
 *
 * Inspired by herm's approach: agents get full control inside their
 * container, no permission prompts, no host access.
 */
export class ContainerRuntime extends EventEmitter {
  private config: ContainerConfig;
  private state: ContainerState;

  constructor(agentId: string, streamId: string, config: Partial<ContainerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONTAINER_CONFIG, ...config };
    this.state = {
      id: '',
      status: 'creating',
      agentId,
      streamId,
      startedAt: null,
      cpuUsage: 0,
      memoryUsageMb: 0,
      lastHealthCheck: null,
    };
  }

  /**
   * Start the container and return a handle.
   */
  async start(): Promise<AgentContainer> {
    const args = this.buildDockerArgs();

    try {
      const { stdout } = await execFileAsync('docker', ['run', '-d', ...args, this.config.baseImage]);
      this.state.id = stdout.trim();
      this.state.status = 'running';
      this.state.startedAt = new Date();

      this.emitEvent('started');
      this.startHealthMonitor();
      this.startTimeoutWatcher();

      return this.createHandle();
    } catch (err) {
      this.state.status = 'error';
      this.emitEvent('error', (err as Error).message);
      throw err;
    }
  }

  /**
   * Get current container state.
   */
  getState(): ContainerState {
    return { ...this.state };
  }

  private buildDockerArgs(): string[] {
    const args: string[] = [];

    // Resource limits
    args.push(`--cpus=${this.config.cpuLimit}`);
    args.push(`--memory=${this.config.memoryLimitMb}m`);

    // Network
    args.push(`--network=${this.config.networkMode}`);

    // Environment
    for (const [key, value] of Object.entries(this.config.env)) {
      args.push('-e', `${key}=${value}`);
    }

    // Volumes
    for (const vol of this.config.volumes) {
      args.push('-v', vol);
    }

    // Labels for tracking
    args.push('--label', `moltstream.agent=${this.state.agentId}`);
    args.push('--label', `moltstream.stream=${this.state.streamId}`);

    // Auto-remove
    if (this.config.autoRemove) {
      args.push('--rm');
    }

    return args;
  }

  private createHandle(): AgentContainer {
    return {
      state: this.state,
      config: this.config,
      exec: async (command: string) => {
        const { stdout, stderr } = await execFileAsync(
          'docker', ['exec', this.state.id, 'sh', '-c', command],
        ).catch(err => ({ stdout: '', stderr: err.message })) as any;
        return { stdout, stderr, exitCode: 0 };
      },
      logs: async function* (follow = false) {
        // Placeholder — would use docker logs --follow in production
        yield `[${new Date().toISOString()}] Container started`;
      },
      stop: async () => {
        this.state.status = 'stopping';
        await execFileAsync('docker', ['stop', this.state.id]).catch(() => {});
        this.state.status = 'exited';
        this.emitEvent('stopped');
      },
      kill: async () => {
        await execFileAsync('docker', ['kill', this.state.id]).catch(() => {});
        this.state.status = 'exited';
        this.emitEvent('stopped');
      },
      stats: async () => {
        try {
          const { stdout } = await execFileAsync(
            'docker', ['stats', '--no-stream', '--format', '{{json .}}', this.state.id],
          );
          const parsed = JSON.parse(stdout);
          return {
            cpuPercent: parseFloat(parsed.CPUPerc) || 0,
            memoryMb: parseFloat(parsed.MemUsage) || 0,
            networkRxBytes: 0,
          };
        } catch {
          return { cpuPercent: 0, memoryMb: 0, networkRxBytes: 0 };
        }
      },
    };
  }

  private startHealthMonitor(): void {
    const interval = setInterval(async () => {
      if (this.state.status !== 'running') {
        clearInterval(interval);
        return;
      }
      try {
        await execFileAsync('docker', ['inspect', '--format', '{{.State.Running}}', this.state.id]);
        this.state.lastHealthCheck = new Date();
      } catch {
        this.state.status = 'error';
        this.emitEvent('health-fail');
        clearInterval(interval);
      }
    }, 10_000);
  }

  private startTimeoutWatcher(): void {
    setTimeout(async () => {
      if (this.state.status === 'running') {
        this.emitEvent('timeout');
        await execFileAsync('docker', ['stop', this.state.id]).catch(() => {});
        this.state.status = 'exited';
      }
    }, this.config.timeoutSec * 1000);
  }

  private emitEvent(type: ContainerEvent['type'], details?: string): void {
    const event: ContainerEvent = {
      type,
      containerId: this.state.id,
      agentId: this.state.agentId,
      timestamp: new Date(),
      details,
    };
    this.emit('container:event', event);
  }
}
