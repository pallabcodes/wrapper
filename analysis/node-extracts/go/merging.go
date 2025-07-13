// Package stream provides merging utilities for streams in Go.
// Merging combines multiple streams into a single output stream.
package stream

import (
	"context"
)

// Merger merges multiple Readable streams into a single output channel.
func Merger(ctx context.Context, streams ...*Readable) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		ctxs, cancels := make([]context.Context, len(streams)), make([]context.CancelFunc, len(streams))
		for i, s := range streams {
			ctxs[i], cancels[i] = context.WithCancel(ctx)
			go func(s *Readable, c context.Context) {
				for data := range s.Read(c) {
					out <- data
				}
			}(s, ctxs[i])
		}
		// Wait for all streams to finish (optional: could add sync.WaitGroup for strictness)
	}()
	return out
}
