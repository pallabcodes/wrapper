// Package stream provides logging utilities for streams in Go.
// This enables structured logging of streaming pipeline events and data.
package stream

import (
	"context"
	"log"
)

// LogMiddleware wraps a Readable and logs each data item using the standard logger.
func LogMiddleware(ctx context.Context, r *Readable, prefix string) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		for data := range r.Read(ctx) {
			log.Printf("%s: %v", prefix, data)
			out <- data
		}
	}()
	return out
}
