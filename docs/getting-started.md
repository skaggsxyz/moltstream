# Getting Started

## Prerequisites

- Node.js >= 20
- npm or pnpm

## Installation

```bash
npm install @moltstream/core @moltstream/adapters @moltstream/policy
```

Or clone the full monorepo:

```bash
git clone https://github.com/skaggsxyz/moltstream.git
cd moltstream
npm install
npm run build
```

## Your First Agent

Create a new file `agent.ts`:

```typescript
import { MoltAgent } from '@moltstream/core';
import { MockAdapter } from '@moltstream/adapters';

const agent = new MoltAgent({
  adapter: new MockAdapter(),
  traces: true,
});

agent.onAudienceEvent('chat', async (event, ctx) => {
  console.log(`[${event.data.user}]: ${event.data.message}`);
  
  // Store interaction in agent memory
  ctx.memory.store({
    sessionId: ctx.session.id,
    type: 'audience',
    data: event.data,
  });
});

agent.start();
```

Run it:

```bash
npx tsx agent.ts
```

You'll see simulated chat events from the MockAdapter. The agent processes each one and stores it in memory.

## Connecting to Twitch

```typescript
import { MoltAgent } from '@moltstream/core';
import { TwitchAdapter } from '@moltstream/adapters';
import { PolicyEngine } from '@moltstream/policy';

const agent = new MoltAgent({
  adapter: new TwitchAdapter({
    streamKey: process.env.TWITCH_STREAM_KEY!,
    channel: 'your_channel',
  }),
  policy: new PolicyEngine({ preset: 'safe-mode' }),
});

agent.start();
```

## Next Steps

- [Scene Graph](/docs/scene-graph.md) — Learn about deterministic scene management
- [Policy Engine](/docs/policy-engine.md) — Configure content rules and safety
- [Reasoning Traces](/docs/traces.md) — Debug agent decisions
