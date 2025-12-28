# Security Architecture

This document describes the security design of the Secure Edge Platform.

## Trust Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         UNTRUSTED ZONE                          │
│                                                                 │
│   Edge Devices (Cameras, Sensors, IoT)                         │
│   - Unknown network conditions                                  │
│   - Potentially compromised                                     │
│   - Must authenticate with device certificate                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ mTLS + IP Allowlist
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ZERO-TRUST BOUNDARY                        │
│                                                                 │
│   Edge Gateway                                                  │
│   - Terminates mTLS                                             │
│   - Validates device certificates against CA                    │
│   - Enforces rate limits per device                             │
│   - Rejects unknown certificates                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Internal mTLS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TRUSTED INTERNAL ZONE                     │
│                                                                 │
│   Ingestor → Kafka → Correlator → Postgres → Query API         │
│   - All traffic encrypted                                       │
│   - NetworkPolicies enforce least-privilege                     │
│   - No direct external access                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Security Controls

### 1. mTLS (Mutual TLS)

**What it does**: Both client and server must present valid certificates.

**Implementation**:
```go
tlsConfig := &tls.Config{
    ClientCAs:  caCertPool,
    ClientAuth: tls.RequireAndVerifyClientCert,  // CRITICAL
    MinVersion: tls.VersionTLS13,
}
```

**Result**: Only devices with CA-signed certificates can connect.

### 2. Certificate-Based Device Identity

Each edge device has a unique certificate with:
- `CN` (Common Name): Device identifier (e.g., `device-001`)
- Signed by our CA
- Cannot be forged without CA private key

### 3. IP Allowlisting

Two layers of defense:
1. **Network Layer**: AWS Security Groups / K8s NetworkPolicies
2. **Application Layer**: CIDR allowlist in Edge Gateway

### 4. Rate Limiting

Per-device rate limits prevent:
- DDoS from compromised devices
- Resource exhaustion
- Noisy neighbor problems

### 5. Kubernetes NetworkPolicies

Default-deny policy with explicit allow rules:

| Source | Destination | Allowed |
|--------|-------------|---------|
| External | Edge Gateway | ✅ Port 8443 |
| Edge Gateway | Ingestor | ✅ Port 3000 |
| Ingestor | Redpanda | ✅ Port 9092 |
| Correlator | Postgres | ✅ Port 5432 |
| Query API | Postgres | ✅ Port 5432 |
| * | * | ❌ Denied |

## Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Unauthorized device | mTLS rejects unknown certs |
| Replay attack | Timestamp validation + nonce |
| Man-in-the-middle | TLS 1.3 encryption |
| Lateral movement | NetworkPolicies + service isolation |
| Data exfiltration | Egress policies + audit logs |

## Verification

### Valid Device (Accepted)
```bash
curl --cert device.crt --key device.key --cacert ca.crt \
  https://localhost:8443/v1/events
# Result: HTTP 202 Accepted
```

### Invalid Device (Rejected)
```bash
curl --cert hacker.crt --key hacker.key --cacert ca.crt \
  https://localhost:8443/v1/events
# Result: TLS handshake failed - certificate signed by unknown authority
```
