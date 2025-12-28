# Demo Video Script (5-7 minutes)

## 🎬 Opening (30 seconds)

**Show**: README.md on screen

**Say**:
> "This is a Secure Real-Time Edge Event Processing Platform. It demonstrates how to build a security-first, event-driven microservices system for processing high-rate events from untrusted edge devices like cameras or IoT sensors."

---

## 🏗️ Architecture Overview (1 minute)

**Show**: `docs/architecture.md` diagram

**Say**:
> "The system has four microservices:
> 1. **Edge Gateway** in Go - handles mTLS termination and rate limiting
> 2. **Ingestor** in NestJS - validates events and publishes to Kafka
> 3. **Correlator** in Go - consumes events and detects patterns
> 4. **Query API** in NestJS - serves data to end users
>
> I chose a hybrid Go + NestJS stack because Go excels at high-throughput edge components, while NestJS is faster for building REST APIs with complex validation."

---

## 🔐 Security Deep Dive (2 minutes)

**Show**: `docs/security.md`

**Say**:
> "Security is the core of this system. Let me show you the trust model."

**Point to diagram**:
> "Edge devices live in an untrusted zone. They must authenticate with mTLS - mutual TLS - where both client and server present certificates."

**Show**: `services/edge-gateway/cmd/server/main.go` (TLS config)

**Say**:
> "Here's the critical line: `ClientAuth: tls.RequireAndVerifyClientCert`. This means the server will reject ANY connection that doesn't present a valid certificate signed by our CA."

**Show**: Terminal - run the security test

```bash
# Valid cert - works
make test-valid

# Invalid cert - rejected
make test-invalid
```

**Say**:
> "Watch what happens with an invalid certificate... The connection is rejected at the TLS layer. The request never reaches our application code. This is zero-trust in action."

---

## ⚡ Live Demo (2 minutes)

**Show**: 3 terminal windows

**Terminal 1**: 
```bash
make gateway
```
> "Edge Gateway starting with mTLS required and rate limiting enabled."

**Terminal 2**:
```bash
make ingestor
```
> "Ingestor connecting to Kafka..."

**Terminal 3**:
```bash
make correlator
```
> "Correlator listening for events..."

**Send test event**:
```bash
make test-valid
```

**Say**:
> "Now I'm sending an event with a valid device certificate. Watch the flow:
> 1. Gateway verifies the cert and logs 'Verified request from device-001'
> 2. Ingestor receives it and publishes to Kafka
> 3. Correlator consumes and processes it"

---

## 🔧 Kubernetes & Production (1 minute)

**Show**: `deploy/k8s/05-network-policies.yaml`

**Say**:
> "For production, I've prepared Kubernetes manifests with NetworkPolicies. Notice the default-deny policy - no traffic is allowed unless explicitly permitted. The Edge Gateway can only talk to the Ingestor, the Ingestor can only talk to Kafka, and so on. This implements least-privilege at the network layer."

---

## 📊 Observability (30 seconds)

**Show**: Grafana at `localhost:3030` or Prometheus at `localhost:9090`

**Say**:
> "Prometheus is scraping metrics from all services. In production, I'd add custom dashboards for:
> - Requests per second
> - Certificate rejections
> - Kafka consumer lag
> - Correlation latency"

---

## 🎯 Closing (30 seconds)

**Say**:
> "To summarize, this project demonstrates:
> 1. **Security as architecture** - mTLS, zero-trust, NetworkPolicies
> 2. **Event-driven design** - Kafka for durability and decoupling
> 3. **Hybrid stack judgment** - Go where performance matters, NestJS where development speed matters
> 4. **Production readiness** - K8s manifests, observability, documentation
>
> Questions?"

---

## 📝 Anticipated Questions & Answers

### "Why not use a service mesh like Istio?"
> "For this demo, I wanted to show explicit mTLS implementation to demonstrate understanding of the underlying mechanics. In production with many services, Istio would be appropriate."

### "How would you handle certificate rotation?"
> "I'd use cert-manager in Kubernetes with short-lived certificates (24h) and automatic renewal. The edge devices would use a device provisioning service to obtain initial certs."

### "What about replay attacks?"
> "Each event should include a timestamp and nonce. The Edge Gateway validates that the timestamp is within acceptable skew (e.g., 5 minutes) and stores nonces in Redis briefly to detect duplicates."

### "How does this scale?"
> "Edge Gateway and Ingestor are stateless - horizontal scaling. Correlator scales with Kafka partitions. I'd partition by source_id so all events from one device go to the same consumer."
