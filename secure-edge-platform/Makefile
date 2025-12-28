.PHONY: all certs infra-up infra-down gateway ingestor correlator test-valid test-invalid

# Generate TLS certificates
certs:
	cd deploy && ./gen-certs.sh

# Start infrastructure (Redpanda, Postgres, Prometheus, Grafana)
infra-up:
	cd deploy && docker-compose up -d

infra-down:
	cd deploy && docker-compose down

# Build services
build-gateway:
	cd services/edge-gateway && go build -o edge-gateway cmd/server/main.go

build-correlator:
	cd services/correlator && go build -o correlator cmd/main.go

# Run services (in separate terminals)
gateway:
	cd services/edge-gateway && ./edge-gateway

ingestor:
	cd services/ingestor && npm run start

correlator:
	cd services/correlator && ./correlator

# Testing
test-valid:
	@echo "Testing with VALID device certificate..."
	cd services/edge-gateway && curl --cert ../../deploy/certs/device.crt \
		--key ../../deploy/certs/device.key \
		--cacert ../../deploy/certs/ca.crt \
		-X POST -H "Content-Type: application/json" \
		-d '{"source_id":"camera-01","source_type":"camera","event_type":"motion","timestamp":"2025-12-25T12:00:00Z","payload":{}}' \
		https://localhost:8443/v1/events

test-invalid:
	@echo "Testing with INVALID certificate (should fail)..."
	cd services/edge-gateway && curl --cert ../../deploy/certs/hacker.crt \
		--key ../../deploy/certs/hacker.key \
		--cacert ../../deploy/certs/ca.crt \
		-X POST https://localhost:8443/v1/events || echo "✅ Correctly rejected!"

# Demo (run all)
demo: certs build-gateway build-correlator
	@echo "Starting demo..."
	@echo "1. Run 'make infra-up' to start infrastructure"
	@echo "2. Run 'make gateway' in terminal 1"
	@echo "3. Run 'make ingestor' in terminal 2"
	@echo "4. Run 'make correlator' in terminal 3"
	@echo "5. Run 'make test-valid' to test"
