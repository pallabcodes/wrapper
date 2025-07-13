// Package stream provides tracing utilities for streams in Go.
// This enables distributed tracing and debugging of streaming pipelines.
package stream

import (
	"context"
	"fmt"
)

// TraceMiddleware wraps a Readable and logs each data item with a trace message.
func TraceMiddleware(ctx context.Context, r *Readable, traceID string) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		for data := range r.Read(ctx) {
			fmt.Printf("[TRACE] %s: %v\n", traceID, data)
			out <- data
		}
	}()
	return out
}
