package gateway

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

// EventHandler handles incoming edge events
// It assumes mTLS has already passed (handled by server config)
func EventHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1. Extract Client Cert Info (Authentication)
	certs := r.TLS.PeerCertificates
	if len(certs) == 0 {
		http.Error(w, "No client certificate", http.StatusUnauthorized)
		return
	}
	clientName := certs[0].Subject.CommonName
	log.Printf("Verified request from Device: %s", clientName)

	// 2. Read Body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// 3. Proxy to Ingestion Service (NestJS)
	resp, err := http.Post("http://localhost:3000/events", "application/json", bytes.NewBuffer(body))
	if err != nil {
		http.Error(w, "Ingestion Service Unavailable", http.StatusBadGateway)
		log.Printf("Proxy error: %v", err)
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	fmt.Fprintf(w, "Event processed by Edge & Cloud")
}
