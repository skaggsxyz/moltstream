import { describe, it, expect, vi } from 'vitest';
import { PluginManager, type MoltPlugin, type ChatMessage } from '../index.js';

function createPlugin(name: string, overrides: Partial<MoltPlugin> = {}): MoltPlugin {
  return {
    manifest: { name, version: '1.0.0' },
    ...overrides,
  };
}

describe('PluginManager', () => {
  it('registers and lists plugins', () => {
    const pm = new PluginManager();
    pm.register(createPlugin('alpha'));
    pm.register(createPlugin('beta'));
    expect(pm.list()).toEqual(['alpha', 'beta']);
  });

  it('throws on duplicate registration', () => {
    const pm = new PluginManager();
    pm.register(createPlugin('dup'));
    expect(() => pm.register(createPlugin('dup'))).toThrow(/already registered/);
  });

  it('calls onInit for all plugins', async () => {
    const pm = new PluginManager();
    const initFn = vi.fn();
    pm.register(createPlugin('a', { onInit: initFn }));
    pm.register(createPlugin('b', { onInit: initFn }));
    await pm.init();
    expect(initFn).toHaveBeenCalledTimes(2);
  });

  it('dispatches messages to plugins', async () => {
    const pm = new PluginManager();
    const handler = vi.fn();
    pm.register(createPlugin('listener', { onMessage: handler }));
    await pm.init();

    const msg: ChatMessage = {
      id: '1',
      sender: 'user',
      content: 'hello',
      timestamp: Date.now(),
    };
    await pm.dispatchMessage(msg);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][1]).toEqual(msg);
  });

  it('resolves dependencies in order', async () => {
    const pm = new PluginManager();
    const order: string[] = [];

    pm.register(
      createPlugin('child', {
        manifest: { name: 'child', version: '1.0.0', dependencies: ['parent'] },
        onInit: () => { order.push('child'); },
      })
    );
    pm.register(
      createPlugin('parent', {
        onInit: () => { order.push('parent'); },
      })
    );

    await pm.init();
    expect(order).toEqual(['parent', 'child']);
  });

  it('detects circular dependencies', async () => {
    const pm = new PluginManager();
    pm.register(
      createPlugin('a', {
        manifest: { name: 'a', version: '1.0.0', dependencies: ['b'] },
      })
    );
    pm.register(
      createPlugin('b', {
        manifest: { name: 'b', version: '1.0.0', dependencies: ['a'] },
      })
    );
    await expect(pm.init()).rejects.toThrow(/Circular dependency/);
  });

  it('disables plugins and skips them in dispatch', async () => {
    const pm = new PluginManager();
    const handler = vi.fn();
    pm.register(createPlugin('skip-me', { onMessage: handler }));
    await pm.init();

    pm.disable('skip-me');
    expect(pm.isEnabled('skip-me')).toBe(false);

    await pm.dispatchMessage({
      id: '1', sender: 'u', content: 'x', timestamp: 0,
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('shuts down in reverse order', async () => {
    const pm = new PluginManager();
    const order: string[] = [];

    pm.register(createPlugin('first', { onShutdown: () => { order.push('first'); } }));
    pm.register(createPlugin('second', { onShutdown: () => { order.push('second'); } }));
    await pm.init();
    await pm.shutdown();
    expect(order).toEqual(['second', 'first']);
  });
});
