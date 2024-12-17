# Docker Image Re-Builder for ARM64

## Overview

The official **Mojaloop Docker images** are currently only available for the **AMD64** platform. When deploying Mojaloop Helm charts on an **ARM-based macOS**, these images run in **emulation mode**, which significantly slows down performance compared to native applications. 

This script aims to address that issue by:

1. Extracting Mojaloop Docker image references from the Docker-Compose script.
2. Cloning the respective repositories from GitHub.
3. Checking out the appropriate tags.
4. Rebuilding the Docker images for **ARM64** architecture.

By building native ARM64 images, the goal is to improve the performance during local testing and development. **In the future**, it is hoped that Mojaloop’s official Docker images will natively support ARM architecture, eliminating the need for such custom builds.


---

## Usage

Make the script executable and run it from your terminal:  

```bash
cd docker_arm_rebuild
chmod +x rebuild.sh
./rebuild.sh
```

## Example Output
```
Building Docker image from repo https://github.com/mojaloop/account-lookup-service.git with tag v15.4.0-snapshot.33
Skipping duplicate image: mojaloop/central-ledger:v15.3.1
Skipping non-mojaloop image: some-other-service:latest
```

## Assumptions

- The script assumes all docker compose image references follow the format mojaloop/repo-name:tag.
