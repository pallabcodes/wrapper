// Package stream provides aggregation utilities for streams in Go.
// Aggregation summarizes or reduces stream data (e.g., sum, count, average).
package stream

import (
	"context"
)

// Aggregate applies a reducer function to the stream and emits the result at the end.
func Aggregate(ctx context.Context, r *Readable, initial interface{}, reducer func(acc, val interface{}) interface{}) <-chan interface{} {
	out := make(chan interface{}, 1)
	go func() {
		defer close(out)
		acc := initial
		for data := range r.Read(ctx) {
			acc = reducer(acc, data)
		}
		out <- acc
	}()
	return out
}

// Count counts the number of elements in the stream.
func Count(ctx context.Context, r *Readable) <-chan int {
	out := make(chan int, 1)
	go func() {
		defer close(out)
		count := 0
		for range r.Read(ctx) {
			count++
		}
		out <- count
	}()
	return out
}

// Sum sums numeric elements in the stream (assumes int for simplicity).
func Sum(ctx context.Context, r *Readable) <-chan int {
	out := make(chan int, 1)
	go func() {
		defer close(out)
		sum := 0
		for data := range r.Read(ctx) {
			if v, ok := data.(int); ok {
				sum += v
			}
		}
		out <- sum
	}()
	return out
}
