package middleware

import (
	"net/http"
	"sync"
	"time"
)

// RateLimiter implements per-device rate limiting
type RateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a rate limiter with specified limit per window
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// Allow checks if a device is within rate limits
func (rl *RateLimiter) Allow(deviceID string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	// Get existing requests for this device
	reqs := rl.requests[deviceID]

	// Filter to only requests within the window
	var valid []time.Time
	for _, t := range reqs {
		if t.After(windowStart) {
			valid = append(valid, t)
		}
	}

	// Check if over limit
	if len(valid) >= rl.limit {
		rl.requests[deviceID] = valid
		return false
	}

	// Add current request
	valid = append(valid, now)
	rl.requests[deviceID] = valid
	return true
}

// Middleware wraps an http.Handler with rate limiting
func (rl *RateLimiter) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract device ID from TLS cert
		deviceID := "unknown"
		if r.TLS != nil && len(r.TLS.PeerCertificates) > 0 {
			deviceID = r.TLS.PeerCertificates[0].Subject.CommonName
		}

		if !rl.Allow(deviceID) {
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		next(w, r)
	}
}
