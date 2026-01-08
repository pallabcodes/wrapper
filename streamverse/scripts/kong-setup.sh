
#!/bin/bash

# Kong Admin API URL
KONG_ADMIN_URL="http://localhost:8001"

echo "🚀 Configuring Kong API Gateway..."

# Wait for Kong to be ready
until curl -s $KONG_ADMIN_URL/status > /dev/null; do
  echo "Waiting for Kong Admin API..."
  sleep 2
done

# Function to create service if not exists
create_service() {
  local name=$1
  local url=$2
  
  echo "Setting up service: $name ($url)"
  
  # Check if service exists
  if curl -s -f "$KONG_ADMIN_URL/services/$name" > /dev/null; then
    echo "  - Service already exists, updating..."
    curl -s -X PATCH "$KONG_ADMIN_URL/services/$name" \
      --data "url=$url"
  else
    echo "  - Creating new service..."
    curl -s -X POST "$KONG_ADMIN_URL/services/" \
      --data "name=$name" \
      --data "url=$url"
  fi
}

# Function to create route
create_route() {
  local service=$1
  local name=$2
  local path=$3
  
  echo "  - Configuring route: $path"
  
  if curl -s -f "$KONG_ADMIN_URL/routes/$name" > /dev/null; then
    curl -s -X PATCH "$KONG_ADMIN_URL/routes/$name" \
      --data "paths[]=$path" \
      --data "strip_path=true"
  else
    curl -s -X POST "$KONG_ADMIN_URL/services/$service/routes" \
      --data "name=$name" \
      --data "paths[]=$path" \
      --data "strip_path=true"
  fi
}

# 1. User Service
create_service "user-service" "http://user-service:3000"
create_route "user-service" "user-routes" "/api/users"

# 2. Payment Service
create_service "payment-service" "http://payment-service:3000"
create_route "payment-service" "payment-routes" "/api/payments"

# 3. Notification Service
create_service "notification-service" "http://notification-service:3000"
create_route "notification-service" "notification-routes" "/api/notifications"

# Enable Global Plugins

echo "🔌 Enabling global plugins..."

# CORS
curl -s -X POST "$KONG_ADMIN_URL/plugins/" \
  --data "name=cors" \
  --data "config.origins=*" \
  --data "config.methods[]=GET" \
  --data "config.methods[]=POST" \
  --data "config.methods[]=PUT" \
  --data "config.methods[]=PATCH" \
  --data "config.methods[]=DELETE" \
  --data "config.methods[]=OPTIONS" \
  --data "config.headers[]=Accept" \
  --data "config.headers[]=Accept-Version" \
  --data "config.headers[]=Content-Length" \
  --data "config.headers[]=Content-MD5" \
  --data "config.headers[]=Content-Type" \
  --data "config.headers[]=Date" \
  --data "config.headers[]=Authorization" \
  --data "config.exposed_headers[]=X-Total-Count" \
  --data "config.credentials=true" \
  --data "config.max_age=3600" || true

# Correlation ID
curl -s -X POST "$KONG_ADMIN_URL/plugins/" \
  --data "name=correlation-id" \
  --data "config.header_name=X-Correlation-ID" \
  --data "config.generator=uuid" \
  --data "config.echo_downstream=true" || true

# Rate Limiting (Global - 100 req/min)
curl -s -X POST "$KONG_ADMIN_URL/plugins/" \
  --data "name=rate-limiting" \
  --data "config.minute=100" \
  --data "config.policy=local" || true

# Stricter Rate Limit for Payments (50 req/min)
echo "🔒 Applying stricter limits for payments..."
curl -s -X POST "$KONG_ADMIN_URL/services/payment-service/plugins" \
  --data "name=rate-limiting" \
  --data "config.minute=50" \
  --data "config.policy=local" || true

echo "✅ Kong Gateway Configuration Complete!"
echo "Gateway URL: http://localhost:8000"