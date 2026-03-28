/**
 * @moltstream/streamer — Health Check Server
 *
 * Lightweight HTTP health endpoint for monitoring agent status.
 * Exposes /health and /metrics for observability.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { createLogger } from '@moltstream/core';

const logger = createLogger('health');

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  agent: {
    name: string;
    connected: boolean;
    lastMessageAt: number | null;
    messagesProcessed: number;
  };
  llm: {
    provider: string;
    model: string;
    avgLatencyMs: number;
    errorRate: number;
  };
  stream: {
    broadcasting: boolean;
    platform: string | null;
    viewerCount: number | null;
  };
}

export interface HealthCheckConfig {
  port?: number;
  host?: string;
}

type HealthProvider = () => HealthStatus;

/**
 * Creates and starts a health check HTTP server.
 * Returns a cleanup function to stop it.
 */
export function startHealthServer(
  getStatus: HealthProvider,
  config: HealthCheckConfig = {}
): { stop: () => Promise<void> } {
  const port = config.port ?? 9100;
  const host = config.host ?? '0.0.0.0';
  const startTime = Date.now();

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://${host}:${port}`);

    if (url.pathname === '/health') {
      try {
        const status = getStatus();
        const code = status.status === 'healthy' ? 200 : status.status === 'degraded' ? 200 : 503;
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
      } catch {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'unhealthy', error: 'failed to collect status' }));
      }
      return;
    }

    if (url.pathname === '/health/live') {
      // Kubernetes liveness — always 200 if process is running
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ alive: true, uptime: Date.now() - startTime }));
      return;
    }

    if (url.pathname === '/health/ready') {
      // Readiness — checks if agent is actually connected and processing
      const status = getStatus();
      const ready = status.agent.connected && status.status !== 'unhealthy';
      res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready, status: status.status }));
      return;
    }

    if (url.pathname === '/metrics') {
      // Prometheus-compatible text format
      try {
        const s = getStatus();
        const lines = [
          '# HELP molt_uptime_seconds Agent uptime in seconds',
          '# TYPE molt_uptime_seconds gauge',
          `molt_uptime_seconds ${s.uptime}`,
          '# HELP molt_messages_total Total messages processed',
          '# TYPE molt_messages_total counter',
          `molt_messages_total ${s.agent.messagesProcessed}`,
          '# HELP molt_llm_latency_ms Average LLM response latency',
          '# TYPE molt_llm_latency_ms gauge',
          `molt_llm_latency_ms ${s.llm.avgLatencyMs}`,
          '# HELP molt_llm_error_rate LLM error rate (0-1)',
          '# TYPE molt_llm_error_rate gauge',
          `molt_llm_error_rate ${s.llm.errorRate}`,
          '# HELP molt_stream_broadcasting Whether agent is broadcasting',
          '# TYPE molt_stream_broadcasting gauge',
          `molt_stream_broadcasting ${s.stream.broadcasting ? 1 : 0}`,
          '# HELP molt_stream_viewers Current viewer count',
          '# TYPE molt_stream_viewers gauge',
          `molt_stream_viewers ${s.stream.viewerCount ?? 0}`,
        ];
        res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
        res.end(lines.join('\n') + '\n');
      } catch {
        res.writeHead(500);
        res.end('# error collecting metrics\n');
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.listen(port, host, () => {
    logger.info(`Health server listening on ${host}:${port}`);
  });

  return {
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
