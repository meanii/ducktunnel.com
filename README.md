# Private P2P Voice Chat 🦆

A simple, secure peer-to-peer voice chat application for friends and family.

## Features
- End-to-end encrypted voice communication
- Minimalist interface with zero tracking
- Web-based client with React + Vite
- Go backend server for signaling
- Dockerized deployment

## Project Structure
```
├── apps/website        # Frontend (React/Vite)
├── services/server     # Backend (Go)
├── compose.yaml        # Docker Compose config
```

## Quick Start
1. Start the application:
```bash
docker compose up --build
```

2. Access the client at:  
   [https://ducktunnel.com/](https://ducktunnel.com/)

## Development
### Frontend
```bash
cd apps/website
pnpm install    # Install dependencies
CERTS_DIR=$CERTS_DIR pnpm dev --host        # Start dev server
```

### Backend
```bash
cd services/server
go mod tidy    # Install dependencies
go run . -port 8000 -cert=$CERTS_DIR/localhost.pem -key=$CERTS_DIR/localhost-key.pem
```

## Deployment
1. Build production images:
```bash
docker compose build
```

2. Run in detached mode:
```bash
docker compose up -d
```

## Configuration
Environment variables (set in `compose.yaml`):
- `PORT`: Backend server port (default: 8080)
- `ENVIRONMENT`: `dev` or `production` (default: dev)
- `CERTS_DIR`: Directory for SSL certificates

## Dependencies
- Frontend: React, Shadcn UI, Vite
- Backend: Go 1.20+
- Container: Docker 20.10+

# References
- [Local SSL Certificates](https://laracasts.com/discuss/channels/vite/how-to-run-a-vite-project-over-https-and-accessible-by-local-network)