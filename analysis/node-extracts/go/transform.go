// Package stream provides a minimal, repurposable Transform stream abstraction in Go.
// This is inspired by Node.js streams but idiomatic to Go's concurrency model.
package stream

import (
	"context"
)

// Transform is a stream that reads, transforms, and writes data.
type Transform struct {
	*Duplex
	transformFn func(interface{}) interface{}
}

// NewTransform creates a new Transform stream with a transform function.
func NewTransform(readBuffer, writeBuffer int, fn func(interface{}) interface{}) *Transform {
	return &Transform{
		Duplex:      NewDuplex(readBuffer, writeBuffer),
		transformFn: fn,
	}
}

// Start begins reading, transforming, and writing data to the output.
func (t *Transform) Start(ctx context.Context) {
	go func() {
		for data := range t.Read(context.Background()) {
			result := t.transformFn(data)
			t.Writable.Write(result)
		}
		// Close output when done
		t.Writable.Close()
	}()
}
