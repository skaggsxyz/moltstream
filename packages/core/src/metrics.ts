/**
 * Telemetry & Metrics
 *
 * Lightweight metrics collection for agent runtime monitoring.
 * Tracks latencies, throughput, error rates, and resource consumption.
 * Supports Prometheus-style exposition and JSON export.
 */

export interface MetricValue {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export type MetricType = 'counter' | 'gauge' | 'histogram';

interface MetricDef {
  name: string;
  type: MetricType;
  help: string;
}

export class Counter {
  private counts = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
  ) {}

  inc(labels: Record<string, string> = {}, amount = 1): void {
    const key = this.labelKey(labels);
    this.counts.set(key, (this.counts.get(key) ?? 0) + amount);
  }

  get(labels: Record<string, string> = {}): number {
    return this.counts.get(this.labelKey(labels)) ?? 0;
  }

  reset(): void {
    this.counts.clear();
  }

  collect(): MetricValue[] {
    return Array.from(this.counts.entries()).map(([key, value]) => ({
      name: this.name,
      value,
      labels: this.parseKey(key),
      timestamp: Date.now(),
    }));
  }

  private labelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  private parseKey(key: string): Record<string, string> {
    if (!key) return {};
    const labels: Record<string, string> = {};
    for (const pair of key.split(',')) {
      const [k, v] = pair.split('=');
      labels[k] = v.replace(/"/g, '');
    }
    return labels;
  }
}

export class Gauge {
  private values = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
  ) {}

  set(value: number, labels: Record<string, string> = {}): void {
    this.values.set(this.labelKey(labels), value);
  }

  inc(labels: Record<string, string> = {}, amount = 1): void {
    const key = this.labelKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + amount);
  }

  dec(labels: Record<string, string> = {}, amount = 1): void {
    const key = this.labelKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) - amount);
  }

  get(labels: Record<string, string> = {}): number {
    return this.values.get(this.labelKey(labels)) ?? 0;
  }

  collect(): MetricValue[] {
    return Array.from(this.values.entries()).map(([key, value]) => ({
      name: this.name,
      value,
      labels: this.parseKey(key),
      timestamp: Date.now(),
    }));
  }

  private labelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  private parseKey(key: string): Record<string, string> {
    if (!key) return {};
    const labels: Record<string, string> = {};
    for (const pair of key.split(',')) {
      const [k, v] = pair.split('=');
      labels[k] = v.replace(/"/g, '');
    }
    return labels;
  }
}

export class Histogram {
  private observations: number[] = [];
  private bucketBounds: number[];

  constructor(
    readonly name: string,
    readonly help: string,
    buckets?: number[],
  ) {
    this.bucketBounds = buckets ?? [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
  }

  observe(value: number): void {
    this.observations.push(value);
  }

  get count(): number {
    return this.observations.length;
  }

  get sum(): number {
    return this.observations.reduce((a, b) => a + b, 0);
  }

  get mean(): number {
    return this.count === 0 ? 0 : this.sum / this.count;
  }

  percentile(p: number): number {
    if (this.observations.length === 0) return 0;
    const sorted = [...this.observations].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  buckets(): Array<{ le: number; count: number }> {
    return this.bucketBounds.map((le) => ({
      le,
      count: this.observations.filter((v) => v <= le).length,
    }));
  }

  reset(): void {
    this.observations = [];
  }
}

/**
 * Central metrics registry
 */
export class MetricsRegistry {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();

  counter(name: string, help: string): Counter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Counter(name, help));
    }
    return this.counters.get(name)!;
  }

  gauge(name: string, help: string): Gauge {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Gauge(name, help));
    }
    return this.gauges.get(name)!;
  }

  histogram(name: string, help: string, buckets?: number[]): Histogram {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new Histogram(name, help, buckets));
    }
    return this.histograms.get(name)!;
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, counter] of this.counters) {
      result[name] = { type: 'counter', values: counter.collect() };
    }
    for (const [name, gauge] of this.gauges) {
      result[name] = { type: 'gauge', values: gauge.collect() };
    }
    for (const [name, hist] of this.histograms) {
      result[name] = {
        type: 'histogram',
        count: hist.count,
        sum: hist.sum,
        mean: hist.mean,
        p50: hist.percentile(50),
        p95: hist.percentile(95),
        p99: hist.percentile(99),
        buckets: hist.buckets(),
      };
    }
    return result;
  }

  reset(): void {
    this.counters.forEach((c) => c.reset());
    this.histograms.forEach((h) => h.reset());
  }
}

/** Global default registry */
export const defaultRegistry = new MetricsRegistry();
