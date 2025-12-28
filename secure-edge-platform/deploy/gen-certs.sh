#!/bin/bash
set -e

mkdir -p certs
cd certs

# 1. Generate CA
echo "Generating CA..."
openssl req -x509 -new -nodes -days 365 -newkey rsa:2048 \
  -keyout ca.key -out ca.crt \
  -subj "/CN=SecureEdgeCA"

# 2. Generate Server Cert (Edge Gateway)
echo "Generating Server Cert..."
openssl req -new -newkey rsa:2048 -nodes \
  -keyout server.key -out server.csr \
  -subj "/CN=edge-gateway"

openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 \
  -extfile <(printf "subjectAltName=DNS:localhost,DNS:edge-gateway,IP:127.0.0.1")

# 3. Generate Device Cert (Valid Device)
echo "Generating Device Cert..."
openssl req -new -newkey rsa:2048 -nodes \
  -keyout device.key -out device.csr \
  -subj "/CN=device-001/O=SecureDevice"

openssl x509 -req -in device.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out device.crt -days 365

# 4. Generate Invalid Cert (For testing failure)
echo "Generating Invalid Cert..."
openssl req -new -newkey rsa:2048 -nodes \
  -keyout hacker.key -out hacker.csr \
  -subj "/CN=hacker"

openssl x509 -req -in hacker.csr -signkey hacker.key -out hacker.crt -days 365

echo "Certificates generated in certs/"
