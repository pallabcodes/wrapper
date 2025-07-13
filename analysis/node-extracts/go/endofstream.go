// Package stream provides a minimal end-of-stream utility in Go.
// This is inspired by Node.js's end-of-stream utility.
package stream

import (
	"context"
)

// EndOfStream waits for a Readable to finish and calls cb.
func EndOfStream(ctx context.Context, r *Readable, cb func(error)) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				cb(ctx.Err())
				return
			case _, ok := <-r.dataCh:
				if !ok {
					cb(nil)
					return
				}
			}
		}
	}()
}
