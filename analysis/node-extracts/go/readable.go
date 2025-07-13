// Package stream provides a minimal, repurposable Readable stream abstraction in Go.
// This is inspired by Node.js streams but idiomatic to Go's concurrency model.
package stream

import (
	"context"
)

// Readable is a generic async data source (file, socket, etc.)
type Readable struct {
	dataCh   chan interface{}
	doneCh   chan struct{}
	closed   bool
}

// NewReadable creates a new Readable stream with a given buffer size.
func NewReadable(bufferSize int) *Readable {
	return &Readable{
		dataCh: make(chan interface{}, bufferSize),
		doneCh: make(chan struct{}),
	}
}

// Push adds data to the stream. Returns false if closed.
func (r *Readable) Push(data interface{}) bool {
	if r.closed {
		return false
	}
	r.dataCh <- data
	return true
}

// Read returns a channel to receive data from the stream.
func (r *Readable) Read(ctx context.Context) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return
			case <-r.doneCh:
				return
			case d, ok := <-r.dataCh:
				if !ok {
					return
				}
				out <- d
			}
		}
	}()
	return out
}

// Close signals no more data will be pushed.
func (r *Readable) Close() {
	if !r.closed {
		close(r.doneCh)
		close(r.dataCh)
		r.closed = true
	}
}
