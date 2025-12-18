#!/bin/bash
# Download Azure PostgreSQL Flexible Server Root CA Certificate
# This script downloads DigiCertGlobalRootG2.crt.pem for Azure PostgreSQL

CA_DIR="/home/ali/dokon/backend/certs"
CA_FILE="$CA_DIR/DigiCertGlobalRootG2.crt.pem"

# Create certs directory if it doesn't exist
mkdir -p "$CA_DIR"

# Download Azure PostgreSQL root CA certificate
echo "Downloading Azure PostgreSQL Root CA certificate..."
curl -o "$CA_FILE" https://cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem

if [ $? -eq 0 ]; then
    echo "✅ Certificate downloaded successfully to: $CA_FILE"
    echo ""
    echo "To use this certificate, set environment variable:"
    echo "export AZURE_POSTGRES_CA_PATH=\"$CA_FILE\""
else
    echo "❌ Failed to download certificate"
    exit 1
fi








