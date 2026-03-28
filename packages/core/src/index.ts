export { MoltAgent, type MoltAgentConfig } from './agent.js';
export { Session, type SessionState } from './session.js';
export { SceneGraph, type SceneNode, type SceneTransition } from './scene-graph.js';
export { AgentMemory, type MemoryEntry } from './memory.js';
export { EventBus, type MoltEvent } from './events.js';
export { createLogger, type Logger } from './logger.js';
export {
  type ReasoningEngine,
  type ReasoningContext,
  type ReasoningResult,
  type AudienceSignal,
  RuleEngine,
  LLMEngine,
  type Rule,
} from './reasoning.js';
export {
  VectorMemory,
  type VectorEntry,
  type SearchResult,
  type SearchFilter,
  type EmbeddingProvider,
  type VectorBackend,
  InMemoryVectorBackend,
  HashEmbeddingProvider,
} from './vector-memory.js';
export {
  FrameType,
  FrameCodec,
  ConnectionPool,
  type Frame,
  type ScenePayload,
  type ReasonPayload,
  type MemoryPayload,
  type AudiencePayload,
  type HeartbeatPayload,
  type WSConnection,
} from './ws-protocol.js';
export {
  Counter,
  Gauge,
  Histogram,
  MetricsRegistry,
  defaultRegistry,
  type MetricValue,
  type MetricType,
} from './metrics.js';
export {
  TokenBucket,
  SlidingWindow,
  RateLimiter,
  KeyedRateLimiter,
  type RateLimitConfig,
} from './rate-limiter.js';
export {
  MoltError,
  Errors,
  type MoltErrorOptions,
  type ErrorSeverity,
  type ErrorCategory,
} from './errors.js';
export {
  PluginManager,
  type MoltPlugin,
  type PluginHooks,
  type PluginManifest,
  type PluginContext,
  type ChatMessage,
} from './plugin.js';
