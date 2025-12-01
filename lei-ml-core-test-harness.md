# Merchant Registry Profile Setup

This document outlines the setup, configuration, and execution of the `merchant-registry` profile defined in the `docker-compose.yml` file.

## Overview

The `merchant-registry` profile is designed to run a set of services that constitute the Merchant Registry feature, along with the core Mojaloop services required for it to operate.

### Core Merchant Registry Services

These services are specific to the merchant registry functionality:

-   **`acquirer-backend`**: The main backend service for the acquirer side of the merchant registry. It handles business logic, API requests, and communication with other services.
-   **`acquirer-frontend`**: The user interface for the acquirer, allowing interaction with the backend.
-   **`registry-oracle`**: A service that seems to act as an oracle or a source of truth for the registry, communicating via RabbitMQ.
-   **`rabbitmq`**: A message broker for asynchronous communication between the `acquirer-backend` and `registry-oracle`.
-   **`merchant-db`**: A MySQL database instance dedicated to the merchant registry services. It is initialized with scripts from `merchant-registry-svc-sprak/mysql-init-scripts`.
-   **`minio`**: An S3-compatible object storage service, used for storing merchant documents.

### Mojaloop Dependency Services

The profile also starts a comprehensive set of standard Mojaloop services, including:
- `central-ledger`
- `quoting-service`
- `ml-api-adapter`
- `account-lookup-service`
- `simulator`
- `mojaloop-testing-toolkit`
- And various databases, caches, and messaging infrastructure (`mysql`, `kafka`, `redis`, `objstore`).

## How to Run

To start all the services associated with the `merchant-registry` profile, use the following command from the root of the project directory:

```bash
docker-compose --profile merchant-registry up -d
```

This command will build the necessary images (for `acquirer-backend`, `acquirer-frontend`, and `registry-oracle`) and start all the defined services in detached mode.

### Accessing Services

Once running, you can access the main user-facing services at:

-   **Merchant Registry / Merchant Acquiring Portal**: `http://localhost:5173`
-   **Mojaloop Testing Toolkit**: `http://localhost:9660`
