// Package stream provides a minimal, repurposable pipeline utility in Go.
// This is inspired by Node.js's pipeline utility but idiomatic to Go's concurrency model.
package stream

import (
	"context"
)

// Pipeline composes multiple stages (Readable, Transform, Writable) into a chain.
func Pipeline(ctx context.Context, stages ...interface{}) error {
	if len(stages) < 2 {
		return ErrPipelineTooShort
	}

	// Connect each stage to the next
	for i := 0; i < len(stages)-1; i++ {
		src, ok1 := stages[i].(*Readable)
		dst, ok2 := stages[i+1].(*Writable)
		if ok1 && ok2 {
			go func(s *Readable, d *Writable) {
				for data := range s.Read(ctx) {
					if !d.Write(data) {
						break
					}
				}
				// Optionally close the destination
				// d.Close()
			}(src, dst)
		}
	}
	return nil
}

// ErrPipelineTooShort is returned if less than two stages are provided.
var ErrPipelineTooShort = &PipelineError{"pipeline requires at least two stages"}

type PipelineError struct{ msg string }
func (e *PipelineError) Error() string { return e.msg }
