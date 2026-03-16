/**
 * Container isolation for agent streams.
 * Each agent runs in its own Docker container with:
 * - Isolated filesystem
 * - Network sandboxing
 * - Resource limits (CPU, memory)
 * - Automatic cleanup on stream end
 */

export interface ContainerConfig {
  /** Docker image to use as base */
  baseImage: string;
  /** CPU limit in cores (e.g. 0.5) */
  cpuLimit: number;
  /** Memory limit in MB */
  memoryLimitMb: number;
  /** Network mode: bridge, none, host */
  networkMode: 'bridge' | 'none' | 'host';
  /** Environment variables to inject */
  env: Record<string, string>;
  /** Volumes to mount (host:container) */
  volumes: string[];
  /** Auto-remove container on exit */
  autoRemove: boolean;
  /** Timeout in seconds before force-kill */
  timeoutSec: number;
}

export interface ContainerState {
  id: string;
  status: 'creating' | 'running' | 'paused' | 'stopping' | 'exited' | 'error';
  agentId: string;
  streamId: string;
  startedAt: Date | null;
  cpuUsage: number;
  memoryUsageMb: number;
  lastHealthCheck: Date | null;
}

export interface AgentContainer {
  /** Container state */
  state: ContainerState;
  /** Container configuration */
  config: ContainerConfig;
  /** Execute a command inside the container */
  exec(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  /** Stream logs from the container */
  logs(follow?: boolean): AsyncGenerator<string>;
  /** Stop the container gracefully */
  stop(): Promise<void>;
  /** Force kill the container */
  kill(): Promise<void>;
  /** Get resource usage snapshot */
  stats(): Promise<{ cpuPercent: number; memoryMb: number; networkRxBytes: number }>;
}

export interface ContainerEvent {
  type: 'started' | 'stopped' | 'error' | 'oom' | 'timeout' | 'health-fail';
  containerId: string;
  agentId: string;
  timestamp: Date;
  details?: string;
}

export const DEFAULT_CONTAINER_CONFIG: ContainerConfig = {
  baseImage: 'moltstream/agent-runtime:latest',
  cpuLimit: 1.0,
  memoryLimitMb: 512,
  networkMode: 'bridge',
  env: {},
  volumes: [],
  autoRemove: true,
  timeoutSec: 3600,
};
