// Package stream provides join utilities for streams in Go.
// Join patterns combine two streams based on a key or time window.
package stream

import (
	"context"
)

// InnerJoin joins two streams on a key function. Emits pairs where keys match.
func InnerJoin(ctx context.Context, left, right *Readable, leftKey, rightKey func(interface{}) interface{}) <-chan [2]interface{} {
	out := make(chan [2]interface{})
	go func() {
		defer close(out)
		leftMap := make(map[interface{}][]interface{})
		rightMap := make(map[interface{}][]interface{})
		leftCh := left.Read(ctx)
		rightCh := right.Read(ctx)
		for leftCh != nil || rightCh != nil {
			select {
			case l, ok := <-leftCh:
				if !ok {
					leftCh = nil
					continue
				}
				k := leftKey(l)
				if rs, found := rightMap[k]; found {
					for _, r := range rs {
						out <- [2]interface{}{l, r}
					}
				}
				leftMap[k] = append(leftMap[k], l)
			case r, ok := <-rightCh:
				if !ok {
					rightCh = nil
					continue
				}
				k := rightKey(r)
				if ls, found := leftMap[k]; found {
					for _, l := range ls {
						out <- [2]interface{}{l, r}
					}
				}
				rightMap[k] = append(rightMap[k], r)
			}
		}
	}()
	return out
}
