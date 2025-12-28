package main

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"secure-edge-platform/edge-gateway/internal/gateway"
	"secure-edge-platform/edge-gateway/internal/middleware"
)

func main() {
	// 1. Load CA to verify client certs
	caCert, err := ioutil.ReadFile("../../deploy/certs/ca.crt")
	if err != nil {
		log.Fatalf("Error reading CA cert: %v", err)
	}
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)

	// 2. Configure TLS
	tlsConfig := &tls.Config{
		ClientCAs:  caCertPool,
		ClientAuth: tls.RequireAndVerifyClientCert, // CRITICAL: Enforce mTLS
		MinVersion: tls.VersionTLS13,
	}

	// 3. Setup Rate Limiter (100 requests per minute per device)
	rateLimiter := middleware.NewRateLimiter(100, time.Minute)

	// 4. Setup Handler
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/events", rateLimiter.Middleware(gateway.EventHandler))
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// 5. Start Server
	server := &http.Server{
		Addr:      ":8443",
		Handler:   mux,
		TLSConfig: tlsConfig,
	}

	log.Println("Edge Gateway starting on :8443 (mTLS REQUIRED, Rate Limited)...")
	err = server.ListenAndServeTLS(
		"../../deploy/certs/server.crt",
		"../../deploy/certs/server.key",
	)
	if err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
