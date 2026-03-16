import { ContainerRuntime } from './runtime';
import type { ContainerConfig, ContainerState, AgentContainer } from './types';
import { EventEmitter } from 'events';

/**
 * ContainerPool manages a fleet of agent containers.
 * Handles allocation, scaling, and lifecycle of multiple
 * concurrent agent streams.
 */
export class ContainerPool extends EventEmitter {
  private containers: Map<string, { runtime: ContainerRuntime; handle: AgentContainer | null }> = new Map();
  private maxContainers: number;
  private defaultConfig: Partial<ContainerConfig>;

  constructor(maxContainers: number = 10, defaultConfig: Partial<ContainerConfig> = {}) {
    super();
    this.maxContainers = maxContainers;
    this.defaultConfig = defaultConfig;
  }

  /**
   * Spawn a new container for an agent stream.
   * Returns null if pool is at capacity.
   */
  async spawn(
    agentId: string,
    streamId: string,
    config?: Partial<ContainerConfig>,
  ): Promise<AgentContainer | null> {
    if (this.containers.size >= this.maxContainers) {
      this.emit('pool:full', { agentId, streamId });
      return null;
    }

    const runtime = new ContainerRuntime(agentId, streamId, {
      ...this.defaultConfig,
      ...config,
    });

    runtime.on('container:event', (event) => {
      this.emit('container:event', event);
      if (event.type === 'stopped' || event.type === 'error') {
        this.containers.delete(streamId);
      }
    });

    const handle = await runtime.start();
    this.containers.set(streamId, { runtime, handle });
    return handle;
  }

  /**
   * Stop a specific stream's container.
   */
  async stop(streamId: string): Promise<void> {
    const entry = this.containers.get(streamId);
    if (entry?.handle) {
      await entry.handle.stop();
      this.containers.delete(streamId);
    }
  }

  /**
   * Stop all containers in the pool.
   */
  async stopAll(): Promise<void> {
    const promises = [...this.containers.keys()].map(id => this.stop(id));
    await Promise.allSettled(promises);
  }

  /**
   * Get states of all active containers.
   */
  list(): ContainerState[] {
    return [...this.containers.values()]
      .filter(e => e.handle)
      .map(e => e.runtime.getState());
  }

  /**
   * Current pool utilization.
   */
  utilization(): { active: number; max: number; percent: number } {
    const active = this.containers.size;
    return {
      active,
      max: this.maxContainers,
      percent: Math.round((active / this.maxContainers) * 100),
    };
  }
}
