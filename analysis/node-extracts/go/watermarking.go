// Package stream provides watermarking utilities for streams in Go.
// Watermarking tracks event time and progress for out-of-order data.
package stream

import (
	"context"
	"time"
)

// WatermarkedData wraps data with an event time.
type WatermarkedData struct {
	Data      interface{}
	EventTime time.Time
}

// Watermark emits the current watermark (min event time seen so far) for each data item.
func Watermark(ctx context.Context, r *Readable, allowedLateness time.Duration) <-chan time.Time {
	out := make(chan time.Time)
	go func() {
		defer close(out)
		var minTime time.Time
		for d := range r.Read(ctx) {
			wd, ok := d.(WatermarkedData)
			if !ok {
				continue
			}
			if minTime.IsZero() || wd.EventTime.Before(minTime) {
				minTime = wd.EventTime
			}
			watermark := minTime.Add(-allowedLateness)
			out <- watermark
		}
	}()
	return out
}
