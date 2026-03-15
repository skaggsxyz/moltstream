import { describe, it, expect } from 'vitest';
import { SceneGraph } from '../src/scene-graph.js';

describe('SceneGraph', () => {
  it('should register scenes and set first as default', () => {
    const sg = new SceneGraph();
    sg.register({ id: 'intro', type: 'composite', layers: [] });
    sg.register({ id: 'main', type: 'composite', layers: [] });

    expect(sg.current()).toBe('intro');
    expect(sg.listScenes()).toEqual(['intro', 'main']);
  });

  it('should transition between scenes', () => {
    const sg = new SceneGraph();
    sg.register({ id: 'a', type: 'composite', layers: [] });
    sg.register({ id: 'b', type: 'composite', layers: [] });

    const t = sg.transition('b', 'fade', 300);

    expect(t.from).toBe('a');
    expect(t.to).toBe('b');
    expect(t.type).toBe('fade');
    expect(sg.current()).toBe('b');
  });

  it('should throw on invalid transition target', () => {
    const sg = new SceneGraph();
    sg.register({ id: 'a', type: 'composite', layers: [] });

    expect(() => sg.transition('nonexistent')).toThrow('not registered');
  });

  it('should maintain transition history', () => {
    const sg = new SceneGraph();
    sg.register({ id: 'a', type: 'composite', layers: [] });
    sg.register({ id: 'b', type: 'composite', layers: [] });
    sg.register({ id: 'c', type: 'composite', layers: [] });

    sg.transition('b');
    sg.transition('c');

    const history = sg.history();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe('a');
    expect(history[1].to).toBe('c');
  });
});
