// Package stream provides splitting utilities for streams in Go.
// Splitting divides a stream based on a user-defined predicate.
package stream

import (
	"context"
)

// Splitter reads from a Readable and emits slices split by the predicate.
// When pred(data) returns true, a new slice is started.
func Splitter(ctx context.Context, r *Readable, pred func(interface{}) bool) <-chan []interface{} {
	out := make(chan []interface{})
	go func() {
		defer close(out)
		var chunk []interface{}
		for data := range r.Read(ctx) {
			if pred(data) && len(chunk) > 0 {
				out <- chunk
				chunk = nil
			}
			chunk = append(chunk, data)
		}
		if len(chunk) > 0 {
			out <- chunk
		}
	}()
	return out
}
