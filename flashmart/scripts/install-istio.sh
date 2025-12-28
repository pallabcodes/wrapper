#!/bin/bash

# FlashMart Istio Service Mesh Installation Script
# This script installs Istio service mesh for FlashMart microservices

set -e

echo "🚀 Installing Istio Service Mesh for FlashMart..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if istioctl is available, if not install Istio
if ! command -v istioctl &> /dev/null; then
    echo "📦 Installing Istio CLI..."

    # Download and install Istio
    curl -L https://istio.io/downloadIstio | sh -
    cd istio-*
    export PATH=$PWD/bin:$PATH

    echo "✅ Istio CLI installed"
else
    echo "✅ Istio CLI already installed"
fi

# Create istio-system namespace if it doesn't exist
kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -

# Install Istio with demo profile (lightweight for development/production)
echo "🔧 Installing Istio service mesh..."
istioctl install --set profile=demo -y

# Wait for Istio components to be ready
echo "⏳ Waiting for Istio to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/istiod -n istio-system

# Enable Istio injection in flashmart namespace
echo "🔧 Enabling sidecar injection in flashmart namespace..."
kubectl create namespace flashmart --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace flashmart istio-injection=enabled --overwrite

# Apply Istio configurations
echo "📋 Applying Istio configurations..."
kubectl apply -f deploy/k8s/istio/

# Wait for ingress gateway to be ready
echo "⏳ Waiting for Istio ingress gateway..."
kubectl wait --for=condition=available --timeout=300s deployment/istio-ingressgateway -n istio-system

# Get ingress gateway IP/hostname
echo "🌐 Istio ingress gateway information:"
kubectl get svc istio-ingressgateway -n istio-system

# Display completion message
echo ""
echo "🎉 Istio Service Mesh installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy FlashMart services: kubectl apply -f deploy/k8s/"
echo "2. Access your application via Istio Gateway"
echo "3. View Kiali dashboard: istioctl dashboard kiali"
echo "4. View Jaeger tracing: istioctl dashboard jaeger"
echo ""
echo "🔗 Useful commands:"
echo "- Check sidecar injection: kubectl get pods -n flashmart -o jsonpath='{.items[*].spec.containers[*].name}'"
echo "- View service mesh: istioctl proxy-status"
echo "- Check gateway routes: kubectl get virtualservice -n flashmart"
echo ""
echo "📊 Monitoring:"
echo "- Kiali: http://localhost:20001 (istioctl dashboard kiali)"
echo "- Jaeger: http://localhost:16686 (istioctl dashboard jaeger)"
echo "- Prometheus: http://localhost:9090 (istioctl dashboard prometheus)"
