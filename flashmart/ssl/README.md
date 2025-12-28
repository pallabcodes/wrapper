# SSL Certificates for FlashMart

## Development Certificates

These are self-signed certificates for local development. In production, use certificates from:
- Let's Encrypt (free)
- AWS Certificate Manager
- DigiCert, GlobalSign, etc.

## Generating New Certificates

```bash
# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout flashmart.key \
  -out flashmart.crt \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=FlashMart/CN=api.flashmart.com"

# For production, use certbot with Let's Encrypt:
# certbot certonly --standalone -d api.flashmart.com
```

## Certificate Files

- `flashmart.crt` - SSL certificate
- `flashmart.key` - Private key
- `README.md` - This file

## Security Notes

- Never commit private keys to version control
- Rotate certificates regularly (90 days recommended)
- Use strong cipher suites (configured in nginx.conf)
- Enable HSTS in production
- Consider certificate pinning for mobile apps
