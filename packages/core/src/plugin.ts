/**
 * @moltstream/core — Plugin System
 *
 * Extensible plugin architecture for MoltStream agents.
 * Plugins hook into the agent lifecycle: init, message, scene change, shutdown.
 */

import { EventBus, type MoltEvent } from './events.js';
import { createLogger, type Logger } from './logger.js';

/** Plugin lifecycle hooks */
export interface PluginHooks {
  /** Called when the agent starts */
  onInit?: (ctx: PluginContext) => Promise<void> | void;
  /** Called on every incoming chat message */
  onMessage?: (ctx: PluginContext, message: ChatMessage) => Promise<void> | void;
  /** Called on scene transitions */
  onSceneChange?: (ctx: PluginContext, from: string, to: string) => Promise<void> | void;
  /** Called when the agent shuts down */
  onShutdown?: (ctx: PluginContext) => Promise<void> | void;
  /** Called on each tick (configurable interval) */
  onTick?: (ctx: PluginContext) => Promise<void> | void;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PluginManifest {
  /** Unique plugin identifier */
  name: string;
  /** Semantic version */
  version: string;
  /** Human-readable description */
  description?: string;
  /** Plugin dependencies (other plugin names) */
  dependencies?: string[];
}

export interface MoltPlugin extends PluginHooks {
  manifest: PluginManifest;
}

export interface PluginContext {
  logger: Logger;
  events: EventBus;
  config: Record<string, unknown>;
  /** Shared state across plugins within a session */
  store: Map<string, unknown>;
}

interface RegisteredPlugin {
  plugin: MoltPlugin;
  enabled: boolean;
  loadOrder: number;
}

/**
 * PluginManager — manages plugin lifecycle and dispatch.
 *
 * Handles dependency resolution, ordered initialization, and
 * hook dispatch across all registered plugins.
 */
export class PluginManager {
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private store: Map<string, unknown> = new Map();
  private events: EventBus;
  private logger: Logger;
  private initialized = false;
  private nextOrder = 0;

  constructor(events?: EventBus) {
    this.events = events ?? new EventBus();
    this.logger = createLogger('plugin-manager');
  }

  /** Register a plugin. Throws if duplicate or already initialized. */
  register(plugin: MoltPlugin): void {
    const { name } = plugin.manifest;

    if (this.initialized) {
      throw new Error(`Cannot register plugin "${name}" after init`);
    }

    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" already registered`);
    }

    this.plugins.set(name, {
      plugin,
      enabled: true,
      loadOrder: this.nextOrder++,
    });

    this.logger.info(`Registered plugin: ${name} v${plugin.manifest.version}`);
  }

  /** Resolve dependency order and initialize all plugins */
  async init(config: Record<string, unknown> = {}): Promise<void> {
    if (this.initialized) return;

    // Validate dependencies
    for (const [name, reg] of this.plugins) {
      const deps = reg.plugin.manifest.dependencies ?? [];
      for (const dep of deps) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin "${name}" requires "${dep}" which is not registered`
          );
        }
      }
    }

    // Topological sort by dependencies
    const sorted = this.topologicalSort();

    for (const name of sorted) {
      const reg = this.plugins.get(name)!;
      if (!reg.enabled) continue;

      const ctx = this.createContext(config);
      try {
        await reg.plugin.onInit?.(ctx);
        this.logger.info(`Initialized plugin: ${name}`);
      } catch (err) {
        this.logger.error(`Failed to init plugin "${name}":`, err);
        reg.enabled = false;
      }
    }

    this.initialized = true;
    this.events.emit({ type: 'plugin:all-initialized', data: { count: sorted.length } });
  }

  /** Dispatch a message to all enabled plugins */
  async dispatchMessage(message: ChatMessage): Promise<void> {
    for (const [, reg] of this.enabledPlugins()) {
      try {
        await reg.plugin.onMessage?.(this.createContext({}), message);
      } catch (err) {
        this.logger.error(`Plugin "${reg.plugin.manifest.name}" onMessage error:`, err);
      }
    }
  }

  /** Dispatch a scene change to all enabled plugins */
  async dispatchSceneChange(from: string, to: string): Promise<void> {
    for (const [, reg] of this.enabledPlugins()) {
      try {
        await reg.plugin.onSceneChange?.(this.createContext({}), from, to);
      } catch (err) {
        this.logger.error(`Plugin "${reg.plugin.manifest.name}" onSceneChange error:`, err);
      }
    }
  }

  /** Dispatch tick to all enabled plugins */
  async dispatchTick(): Promise<void> {
    for (const [, reg] of this.enabledPlugins()) {
      try {
        await reg.plugin.onTick?.(this.createContext({}));
      } catch (err) {
        this.logger.error(`Plugin "${reg.plugin.manifest.name}" onTick error:`, err);
      }
    }
  }

  /** Gracefully shut down all plugins in reverse order */
  async shutdown(): Promise<void> {
    const sorted = [...this.enabledPlugins()].reverse();
    for (const [, reg] of sorted) {
      try {
        await reg.plugin.onShutdown?.(this.createContext({}));
        this.logger.info(`Shut down plugin: ${reg.plugin.manifest.name}`);
      } catch (err) {
        this.logger.error(`Plugin "${reg.plugin.manifest.name}" shutdown error:`, err);
      }
    }
    this.initialized = false;
  }

  /** Get all registered plugin names */
  list(): string[] {
    return [...this.plugins.keys()];
  }

  /** Check if a plugin is registered and enabled */
  isEnabled(name: string): boolean {
    return this.plugins.get(name)?.enabled ?? false;
  }

  /** Disable a plugin by name */
  disable(name: string): void {
    const reg = this.plugins.get(name);
    if (reg) reg.enabled = false;
  }

  private createContext(config: Record<string, unknown>): PluginContext {
    return {
      logger: this.logger,
      events: this.events,
      config,
      store: this.store,
    };
  }

  private *enabledPlugins(): Iterable<[string, RegisteredPlugin]> {
    for (const [name, reg] of this.plugins) {
      if (reg.enabled) yield [name, reg];
    }
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (name: string, stack: Set<string>) => {
      if (visited.has(name)) return;
      if (stack.has(name)) {
        throw new Error(`Circular dependency detected involving "${name}"`);
      }
      stack.add(name);
      const reg = this.plugins.get(name);
      if (reg) {
        for (const dep of reg.plugin.manifest.dependencies ?? []) {
          visit(dep, stack);
        }
      }
      stack.delete(name);
      visited.add(name);
      result.push(name);
    };

    for (const name of this.plugins.keys()) {
      visit(name, new Set());
    }

    return result;
  }
}
