import { Injectable } from '@nestjs/common';
import { MetricsSnapshot, HistogramData } from './health-check.types';

interface Counter {
  value: number;
  lastReset: number;
}

interface Gauge {
  value: number;
  lastUpdate: number;
}

interface Histogram {
  values: number[];
  sum: number;
  count: number;
  lastReset: number;
}

interface Rate {
  count: number;
  windowStart: number;
  windowSize: number; // milliseconds
}

@Injectable()
export class MetricsService {
  // private readonly logger = new Logger(MetricsService.name);
  private readonly counters = new Map<string, Counter>();
  private readonly gauges = new Map<string, Gauge>();
  private readonly histograms = new Map<string, Histogram>();
  private readonly rates = new Map<string, Rate>();
  private readonly maxHistogramValues = 1000; // Keep last 1000 values

  // Counter operations
  increment(name: string, value: number = 1): void {
    const counter = this.counters.get(name) || { value: 0, lastReset: Date.now() };
    counter.value += value;
    this.counters.set(name, counter);
  }

  decrement(name: string, value: number = 1): void {
    this.increment(name, -value);
  }

  resetCounter(name: string): void {
    this.counters.delete(name);
  }

  getCounter(name: string): number {
    return this.counters.get(name)?.value || 0;
  }

  // Gauge operations
  setGauge(name: string, value: number): void {
    this.gauges.set(name, { value, lastUpdate: Date.now() });
  }

  getGauge(name: string): number {
    return this.gauges.get(name)?.value || 0;
  }

  // Histogram operations
  recordHistogram(name: string, value: number): void {
    const histogram = this.histograms.get(name) || {
      values: [],
      sum: 0,
      count: 0,
      lastReset: Date.now(),
    };

    histogram.values.push(value);
    histogram.sum += value;
    histogram.count++;

    // Keep only the last N values to prevent memory leaks
    if (histogram.values.length > this.maxHistogramValues) {
      const removed = histogram.values.shift()!;
      histogram.sum -= removed;
    }

    this.histograms.set(name, histogram);
  }

  getHistogram(name: string): HistogramData | null {
    const histogram = this.histograms.get(name);
    if (!histogram || histogram.count === 0) {
      return null;
    }

    const sorted = [...histogram.values].sort((a, b) => a - b);
    const count = histogram.count;
    const sum = histogram.sum;
    const mean = sum / count;

    return {
      count,
      sum,
      min: sorted[0] as number,
      max: sorted[sorted.length - 1] as number,
      mean,
      p50: this.percentile(sorted, 0.5)!,
      p90: this.percentile(sorted, 0.9)!,
      p95: this.percentile(sorted, 0.95)!,
      p99: this.percentile(sorted, 0.99)!,
    };
  }

  resetHistogram(name: string): void {
    this.histograms.delete(name);
  }

  // Rate operations
  recordRate(name: string, windowSizeMs: number = 60000): void {
    const now = Date.now();
    const rate = this.rates.get(name) || {
      count: 0,
      windowStart: now,
      windowSize: windowSizeMs,
    };

    // Reset window if it has expired
    if (now - rate.windowStart >= rate.windowSize) {
      rate.count = 1;
      rate.windowStart = now;
    } else {
      rate.count++;
    }

    this.rates.set(name, rate);
  }

  getRate(name: string): number {
    const rate = this.rates.get(name);
    if (!rate) return 0;

    const now = Date.now();
    const elapsed = now - rate.windowStart;
    
    if (elapsed >= rate.windowSize) {
      return 0; // Window has expired
    }

    return (rate.count / elapsed) * 1000; // Rate per second
  }

  // Utility methods
  private percentile(sorted: number[], p: number): number | undefined {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  // Get all metrics snapshot
  getSnapshot(): MetricsSnapshot {
    const timestamp = new Date().toISOString();
    
    const counters: Record<string, number> = {};
    for (const [name, counter] of this.counters) {
      counters[name] = counter.value;
    }

    const gauges: Record<string, number> = {};
    for (const [name, gauge] of this.gauges) {
      gauges[name] = gauge.value;
    }

    const histograms: Record<string, HistogramData> = {};
    for (const [name] of this.histograms) {
      const data = this.getHistogram(name);
      if (data) {
        histograms[name] = data;
      }
    }

    const rates: Record<string, number> = {};
    for (const [name] of this.rates) {
      rates[name] = this.getRate(name);
    }

    return {
      timestamp,
      counters,
      gauges,
      histograms,
      rates,
    };
  }

  // Reset all metrics
  resetAll(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.rates.clear();
  }

  // Clean up old data
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old gauges
    for (const [name, gauge] of this.gauges) {
      if (now - gauge.lastUpdate > maxAge) {
        this.gauges.delete(name);
      }
    }

    // Clean up old histograms
    for (const [name, histogram] of this.histograms) {
      if (now - histogram.lastReset > maxAge) {
        this.histograms.delete(name);
      }
    }

    // Clean up expired rates
    for (const [name, rate] of this.rates) {
      if (now - rate.windowStart >= rate.windowSize) {
        this.rates.delete(name);
      }
    }
  }
}
