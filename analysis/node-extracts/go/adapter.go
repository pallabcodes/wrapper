// Package stream provides adapter utilities for streams in Go.
// This enables integration with external systems and custom sources/sinks.
package stream

import (
	"context"
)

// FromChannel adapts a Go channel to a Readable stream.
func FromChannel(ch <-chan interface{}) *Readable {
	r := NewReadable(1024)
	go func() {
		for data := range ch {
			r.Push(data)
		}
		r.Close()
	}()
	return r
}

// ToChannel adapts a Readable stream to a Go channel.
func ToChannel(ctx context.Context, r *Readable) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		for data := range r.Read(ctx) {
			out <- data
		}
	}()
	return out
}
