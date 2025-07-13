// Package stream provides alerting utilities for streams in Go.
// This enables triggering alerts on specific stream events or data conditions.
package stream

import (
	"context"
)

// AlertFunc is a function that triggers an alert.
type AlertFunc func(data interface{})

// AlertMiddleware wraps a Readable and triggers alerts when the predicate is true.
func AlertMiddleware(ctx context.Context, r *Readable, pred func(interface{}) bool, alert AlertFunc) <-chan interface{} {
	out := make(chan interface{})
	go func() {
		defer close(out)
		for data := range r.Read(ctx) {
			if pred(data) {
				alert(data)
			}
			out <- data
		}
	}()
	return out
}
