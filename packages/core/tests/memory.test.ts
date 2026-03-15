import { describe, it, expect } from 'vitest';
import { AgentMemory } from '../src/memory.js';

describe('AgentMemory', () => {
  it('should store and retrieve entries', () => {
    const mem = new AgentMemory();
    mem.store({ sessionId: 'sess_1', type: 'event', data: { foo: 'bar' } });

    expect(mem.size).toBe(1);
    expect(mem.recent(1)[0].data.foo).toBe('bar');
  });

  it('should filter by type', () => {
    const mem = new AgentMemory();
    mem.store({ sessionId: 's1', type: 'event', data: {} });
    mem.store({ sessionId: 's1', type: 'decision', data: {} });
    mem.store({ sessionId: 's1', type: 'event', data: {} });

    const events = mem.query({ type: 'event' });
    expect(events).toHaveLength(2);
  });

  it('should summarize memory', () => {
    const mem = new AgentMemory();
    for (let i = 0; i < 10; i++) {
      mem.store({ sessionId: 's1', type: i % 2 === 0 ? 'event' : 'decision', data: { i } });
    }

    const summary = mem.summarize();
    expect(summary.total).toBe(10);
    expect(summary.types.event).toBe(5);
    expect(summary.types.decision).toBe(5);
  });
});
