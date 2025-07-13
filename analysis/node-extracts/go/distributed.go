// Package stream provides distributed stream patterns for Go.
// These are basic building blocks for distributed streaming systems.
package stream

import (
	"context"
	"sync"
)

// Partition partitions a stream into N sub-streams using a partition function.
func Partition(ctx context.Context, r *Readable, n int, partFn func(interface{}) int) []*Readable {
	streams := make([]*Readable, n)
	for i := 0; i < n; i++ {
		streams[i] = NewReadable(1024)
	}
	go func() {
		for data := range r.Read(ctx) {
			idx := partFn(data) % n
			streams[idx].Push(data)
		}
		for _, s := range streams {
			s.Close()
		}
	}()
	return streams
}

// FanIn merges multiple streams into one output (like Merger, but with sync).
func FanIn(ctx context.Context, streams ...*Readable) <-chan interface{} {
	out := make(chan interface{})
	var wg sync.WaitGroup
	wg.Add(len(streams))
	for _, s := range streams {
		go func(s *Readable) {
			defer wg.Done()
			for data := range s.Read(ctx) {
				out <- data
			}
		}(s)
	}
	go func() {
		wg.Wait()
		close(out)
	}()
	return out
}
