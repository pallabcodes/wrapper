// Package stream provides hook utilities for streams in Go.
// This enables custom hooks to be triggered on stream events or data.
package stream

import (
	"context"
)

// HookFunc is a function that is called on each data item.
type HookFunc func(data interface{})

// HookMiddleware wraps a Readable and calls the hook on each data item.
func HookMiddleware(ctx context.Context, r *Readable, hook HookFunc) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		for data := range r.Read(ctx) {
			hook(data)
			out <- data
		}
	}()
	return out
}
