// Package stream provides a minimal, repurposable Duplex stream abstraction in Go.
// This is inspired by Node.js streams but idiomatic to Go's concurrency model.
package stream

import (
	"context"
)

// Duplex is a bidirectional stream: both readable and writable.
type Duplex struct {
	*Readable
	*Writable
}

// NewDuplex creates a new Duplex stream with given buffer sizes for read and write.
func NewDuplex(readBuffer, writeBuffer int) *Duplex {
	return &Duplex{
		Readable: NewReadable(readBuffer),
		Writable: NewWritable(writeBuffer),
	}
}

// Pipe connects the output of this Duplex to another Writable.
func (d *Duplex) Pipe(ctx context.Context, dest *Writable) {
	for data := range d.Read(context.Background()) {
		if !dest.Write(data) {
			break
		}
	}
}
