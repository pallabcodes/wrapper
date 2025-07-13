// Package stream provides error handling utilities for streams in Go.
// This enables robust error propagation and handling in streaming pipelines.
package stream

import (
	"context"
)

// ErrorHandler is a function that handles errors in the stream.
type ErrorHandler func(error)

// ErrorAwareReadable wraps a Readable and propagates errors via a channel.
type ErrorAwareReadable struct {
	*Readable
	errCh chan error
}

// NewErrorAwareReadable creates a new error-aware readable stream.
func NewErrorAwareReadable(r *Readable) *ErrorAwareReadable {
	return &ErrorAwareReadable{
		Readable: r,
		errCh:    make(chan error, 1),
	}
}

// EmitError sends an error to the error channel.
func (e *ErrorAwareReadable) EmitError(err error) {
	e.errCh <- err
}

// Errors returns the error channel for listening to errors.
func (e *ErrorAwareReadable) Errors() <-chan error {
	return e.errCh
}
