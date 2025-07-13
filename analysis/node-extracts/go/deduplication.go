// Package stream provides deduplication utilities for streams in Go.
// Deduplication removes duplicate elements from a stream.
package stream

import (
	"context"
)

// Deduplicate emits only unique elements from the input stream, using a key function.
func Deduplicate(ctx context.Context, r *Readable, keyFn func(interface{}) interface{}) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		seen := make(map[interface{}]struct{})
		for data := range r.Read(ctx) {
			key := keyFn(data)
			if _, exists := seen[key]; !exists {
				seen[key] = struct{}{}
				out <- data
			}
		}
	}()
	return out
}
