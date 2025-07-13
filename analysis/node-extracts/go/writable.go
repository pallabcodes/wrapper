// Package stream provides a minimal, repurposable Writable stream abstraction in Go.
// This is inspired by Node.js streams but idiomatic to Go's concurrency model.
package stream

import (
	"context"
)

// Writable is a generic async data sink (file, socket, etc.)
type Writable struct {
	writeCh chan interface{}
	doneCh  chan struct{}
	closed  bool
}

// NewWritable creates a new Writable stream with a given buffer size.
func NewWritable(bufferSize int) *Writable {
	return &Writable{
		writeCh: make(chan interface{}, bufferSize),
		doneCh:  make(chan struct{}),
	}
}

// Write sends data to the sink. Returns false if closed.
func (w *Writable) Write(data interface{}) bool {
	if w.closed {
		return false
	}
	w.writeCh <- data
	return true
}

// Consume reads from the write channel and processes data with the given handler.
func (w *Writable) Consume(ctx context.Context, handler func(interface{})) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-w.doneCh:
			return
		case d, ok := <-w.writeCh:
			if !ok {
				return
			}
			handler(d)
		}
	}
}

// Close signals no more data will be written.
func (w *Writable) Close() {
	if !w.closed {
		close(w.doneCh)
		close(w.writeCh)
		w.closed = true
	}
}
