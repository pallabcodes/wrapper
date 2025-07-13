// Package stream provides minimal, repurposable stream operators in Go.
// These are inspired by Node.js stream operators (map, filter, etc.)
package stream

// Map returns a Transform that applies fn to each input.
func Map(readBuffer, writeBuffer int, fn func(interface{}) interface{}) *Transform {
	return NewTransform(readBuffer, writeBuffer, fn)
}

// Filter returns a Transform that only passes values where fn returns true.
func Filter(readBuffer, writeBuffer int, fn func(interface{}) bool) *Transform {
	return NewTransform(readBuffer, writeBuffer, func(data interface{}) interface{} {
		if fn(data) {
			return data
		}
		return nil
	})
}
