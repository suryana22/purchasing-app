# Authentication Service

This is the standalone Authentication Service for the Hospital Room Service Application. It handles staff login, token generation (JWT), and session management.

## Isolation

This project is designed to run independently from the main hospital application for development and testing purposes.

## Prerequisities

- Docker & Docker Compose

## Quick Start (Standalone)

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```

2.  **Access API**:
    - Health Check: `http://localhost:8005/health`
    - Login (Staff): `POST /login/staff`

## Environment Variables

Copy `.env.example` to `.env` if you need to customize settings locally (Docker Compose uses defaults in `docker-compose.yml`).

## API Endpoints

- `POST /login/staff`: Staff authentication (returns JWT)
- `POST /login/patient`: Patient authentication (proxies to Patient Service - *Note: In standalone mode, this may fail if Patient Service is not reachable via network*)
- `POST /verify`: Verify token validity
