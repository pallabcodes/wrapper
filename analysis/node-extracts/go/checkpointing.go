// Package stream provides checkpointing utilities for streams in Go.
// Checkpointing allows saving and restoring stream state for fault tolerance.
package stream

import (
	"context"
)

// CheckpointHandler is a function that saves or restores state.
type CheckpointHandler func(state interface{}) error

// CheckpointedReadable wraps a Readable with checkpointing capability.
type CheckpointedReadable struct {
	*Readable
	state      interface{}
	saveFn     CheckpointHandler
	restoreFn  CheckpointHandler
}

// NewCheckpointedReadable creates a checkpointed readable stream.
func NewCheckpointedReadable(r *Readable, saveFn, restoreFn CheckpointHandler) *CheckpointedReadable {
	return &CheckpointedReadable{
		Readable:  r,
		saveFn:    saveFn,
		restoreFn: restoreFn,
	}
}

// SaveCheckpoint saves the current state.
func (c *CheckpointedReadable) SaveCheckpoint() error {
	return c.saveFn(c.state)
}

// RestoreCheckpoint restores the state.
func (c *CheckpointedReadable) RestoreCheckpoint() error {
	return c.restoreFn(c.state)
}
