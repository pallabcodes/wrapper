package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

type Event struct {
	SourceID   string                 `json:"source_id"`
	SourceType string                 `json:"source_type"`
	Timestamp  string                 `json:"timestamp"`
	Payload    map[string]interface{} `json:"payload"`
}

func main() {
	// 1. Configure Reader
	topic := "raw-events"
	partition := 0

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   []string{"localhost:9092"}, // Assumes Redpanda running locally
		Topic:     topic,
		Partition: partition,
		MinBytes:  10e3, // 10KB
		MaxBytes:  10e6, // 10MB
	})
	defer r.Close()

	log.Println("Correlation Engine started. Listening for events...")

	// 2. Consume Loop
	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("failed to read message: %v", err)
			break
		}
		
		var event Event
		if err := json.Unmarshal(m.Value, &event); err != nil {
			log.Printf("failed to unmarshal: %v", err)
			continue
		}

		processEvent(event)
	}
}

// processEvent simulates stateful correlation
func processEvent(e Event) {
	// Simple Rule: If SourceID contains "alert", flag it.
	log.Printf("Processing event from %s...", e.SourceID)
	
	// Simulation of stateful processing (e.g. check DB or memory window)
	time.Sleep(10 * time.Millisecond)

	if e.SourceType == "camera" {
		log.Printf("🎥 [VIDEO EVENT] Analyzed frame from %s at %s", e.SourceID, e.Timestamp)
	}
}
