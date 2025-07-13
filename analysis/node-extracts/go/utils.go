// Package stream provides minimal, repurposable stream utility functions in Go.
package stream

// Once returns a function that can only be called once.
func Once(fn func()) func() {
	called := false
	return func() {
		if called {
			return
		}
		called = true
		fn()
	}
}

// IsStream checks if an object implements the basic stream interface.
type Stream interface {
	Close()
}

func IsStream(obj interface{}) bool {
	_, ok := obj.(Stream)
	return ok
}
