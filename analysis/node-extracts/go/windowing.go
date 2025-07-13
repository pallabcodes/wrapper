// Package stream provides windowing utilities for streams in Go.
// Windowing groups stream data into overlapping or tumbling windows.
package stream

import (
	"context"
	"time"
)

// TumblingWindow emits slices of data collected over a fixed time interval.
func TumblingWindow(ctx context.Context, r *Readable, interval time.Duration) <-chan []interface{} {
	out := make(chan []interface{})
	go func() {
		defer close(out)
		var window []interface{}
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case data, ok := <-r.dataCh:
				if !ok {
					if len(window) > 0 {
						out <- window
					}
					return
				}
				window = append(window, data)
			case <-ticker.C:
				if len(window) > 0 {
					out <- window
					window = nil
				}
			}
		}
	}()
	return out
}

// SlidingWindow emits slices of data for each new element, containing the last N elements.
func SlidingWindow(ctx context.Context, r *Readable, size int) <-chan []interface{} {
	out := make(chan []interface{})
	go func() {
		defer close(out)
		window := make([]interface{}, 0, size)
		for data := range r.Read(ctx) {
			window = append(window, data)
			if len(window) > size {
				window = window[1:]
			}
			if len(window) == size {
				copyWin := make([]interface{}, size)
				copy(copyWin, window)
				out <- copyWin
			}
		}
	}()
	return out
}
