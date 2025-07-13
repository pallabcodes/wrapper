// Package stream provides metrics and observability utilities for streams in Go.
// This enables tracking throughput, latency, and other metrics in streaming pipelines.
package stream

import (
	"context"
	"sync/atomic"
	"time"
)

// Metrics holds counters for stream observability.
type Metrics struct {
	Count   int64
	Latency int64 // nanoseconds
}

// MetricsMiddleware wraps a Readable and tracks metrics.
func MetricsMiddleware(ctx context.Context, r *Readable, metrics *Metrics) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		for data := range r.Read(ctx) {
			start := time.Now()
			out <- data
			atomic.AddInt64(&metrics.Count, 1)
			atomic.AddInt64(&metrics.Latency, time.Since(start).Nanoseconds())
		}
	}()
	return out
}
