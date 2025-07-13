// Package stream provides chunking utilities for streams in Go.
// Chunking splits a stream into fixed-size slices for batch processing.
package stream

import (
	"context"
)

// Chunker reads from a Readable and emits slices of size chunkSize.
func Chunker(ctx context.Context, r *Readable, chunkSize int) <-chan []interface{} {
	out := make(chan []interface{})
	go func() {
		defer close(out)
		chunk := make([]interface{}, 0, chunkSize)
		for data := range r.Read(ctx) {
			chunk = append(chunk, data)
			if len(chunk) == chunkSize {
				out <- chunk
				chunk = make([]interface{}, 0, chunkSize)
			}
		}
		if len(chunk) > 0 {
			out <- chunk
		}
	}()
	return out
}
