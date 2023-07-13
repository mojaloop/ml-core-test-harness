# Mojaloop Core test Harness

Run `Mojaloop` in your local machine using docker-compose without need for a `Kubernetes` cluster.

## Pre-requisites:
- git
- docker
- docker-compose

## Starting mojaloop core services for a simple P2P transfer

Execute the following commands to run mojaloop in local machine

```
git clone https://github.com/mojaloop/ml-core-test-harness.git
cd ml-core-test-harness
docker-compose --profile all-services --profile ttk-provisioning --profile ttk-tests up
```

Wait for some time to get all the containers up and healthy.
You can check the status of the containers using the command `docker ps`.

You should see the following output after some time. That means all your mojaloop services are up and test FSPs are onboarded successfully. Now you can run a P2P transfer.

```
┌───────────────────────────────────────────────────┐
│                      SUMMARY                      │
├───────────────────┬───────────────────────────────┤
│ Total assertions  │ 27                            │
├───────────────────┼───────────────────────────────┤
│ Passed assertions │ 27                            │
├───────────────────┼───────────────────────────────┤
│ Failed assertions │ 0                             │
├───────────────────┼───────────────────────────────┤
│ Total requests    │ 4                             │
├───────────────────┼───────────────────────────────┤
│ Total test cases  │ 1                             │
├───────────────────┼───────────────────────────────┤
│ Passed percentage │ 100.00%                       │
├───────────────────┼───────────────────────────────┤
│ Started time      │ Wed, 15 Jun 2022 17:02:28 GMT │
├───────────────────┼───────────────────────────────┤
│ Completed time    │ Wed, 15 Jun 2022 17:02:30 GMT │
├───────────────────┼───────────────────────────────┤
│ Runtime duration  │ 2398 ms                       │
└───────────────────┴───────────────────────────────┘
```

You can see all the test reports at http://localhost:9660/admin/reports and latest report should be available in `reports/` folder.

## Running P2P transfer again in a separate terminal session along with the running mojaloop

After all services been started, if you want to execute the P2P transfer from the command line again, use the following command in a separate terminal session.

```
docker-compose --project-name ttk-test-only --profile ttk-tests up --no-deps
```

_Note: This doesn't wait for any dependent services. You should make sure that all the services are up and healthy.

## Running P2P transfer using testing toolkit web interface

- Open the URL `http://localhost:9660` and go to `Test Runner`
- Goto on `Collection Manager` and click on the button `Import Folder`
- Select the folder `docker/ml-testing-toolkit/test-cases/collections/tests` and import
- Select `p2p.json` and click on the masked area on the right side of the screen
- Collection manager closes and click on `Run` button at the top right corner
- You should see all the tests passed
- You can explore the requests and responses by clicking on `Edit` button next to the test case

## Running P2P transfer using testing toolkit mobile simulator

You can execute a transfer using the mobile simulator page where you can see two virtual mobile applications a sender and receiver.

By making a transfer using sender mobile application, you can see all the mojaloop requests and callbacks visually by means of a live sequence diagram.

http://localhost:9660/mobilesimulator

## Profiles available

| Profile Name | Description | Dependent Profiles |
| -------------------- | ----------- | ----------- |
| all-services | All mojaloop services including TTK | - |
| ttk-provisioning | For setting up mojaloop switch and onboard sample DFSPs | - |
| ttk-tests | TTK tests | - |
| debug | Debug utilities (kowl) | kafka |
| central-ledger | Central Ledger service | kafka |
| ml-api-adapter | ML API Adapter service | central-ledger |
| quoting-service | Quoting service | central-ledger |
| account-lookup-service | Account lookup service | central-ledger |
| discovery | Services used for discovery | - |
| agreement | Services used for agreement | - |
| transfer | Services used for transfer | - |


## Running various services with different profile combinations

### Core services without provisioning
```
docker-compose --profile all-services up
```

### Core services with debug utilities
```
docker-compose --profile all-services --profile debug up
```

### Central ledger
```
docker-compose --profile central-ledger up
```

### Quoting Service
```
docker-compose --profile quoting-service --profile central-ledger up
```
Note: We need to include central-ledger profile also here because its a dependency for quoting service

### Account lookup service
```
docker-compose --profile account-lookup-service --profile central-ledger up
```
Note: We need to include central-ledger profile also here because its a dependency for account lookup service

### ML API Adapter
```
docker-compose --profile ml-api-adapter --profile central-ledger up
```
Note: We need to include central-ledger profile also here because its a dependency for ml-api-adapter

### Discovery
```
docker-compose --profile discovery up
```

### Agreement
```
docker-compose --profile agreement up
```

### Transfer
```
docker-compose --profile transfer up
```

### Settlements
TODO: Add settlement related services

### Bulk
TODO: Add bulk related services

## Functional tests inside CICD

You can use this repo to run functional tests inside the CICD of a core service

The following commands can be added to the CICD pipeline

```bash
git clone --depth 1 --branch v0.0.2 https://github.com/mojaloop/ml-core-test-harness.git
cd ml-core-test-harness

docker-compose --project-name ttk-func --profile all-services --profile ttk-provisioning --profile ttk-tests up -d
bash wait-for-container.sh ttk-func-ttk-tests-1
docker logs ttk-func-ttk-tests-1 > ttk-tests-console.log
docker-compose -p ttk-func down
cat ttk-tests-console.log
ls reports/ttk-func-tests-report.html reports/ttk-provisioning-report.html
```

## Monitoring

Start Monitoring Services stack which uses:
- [Prometheus](https://prometheus.io) for time series data store
- [Grafana](https://grafana.com/) for visualization dashboards
- [Node Exporter](https://github.com/prometheus/node_exporter) to instrument the Host machine
- [CAdviser](https://github.com/google/cadvisor) to instrument the Docker containers running on Host machine


```bash
docker-compose --project-name monitoring -f docker-compose-monitoring.yml up -d
```

Stop Monitoring Services

```bash
docker-compose --project-name monitoring -f docker-compose-monitoring.yml down -v
```

> NOTE: `-v` argument is optional, and it will delete any volume data created by the monitoring docker compose

TODO:
- add note about network being created by main docker-compose, or it can be done manually.

## Performance Characterization

[K6](https://k6.io) is being used to execute performance tests, with metrics being captured by [Prometheus](https://k6.io/docs/results-output/real-time/prometheus-remote-write) and displayed using [Grafana](https://k6.io/docs/results-output/real-time/prometheus-remote-write/#time-series-visualization).

Tests can be defined in the [./docker/k6/scripts/test.js](./docker/k6/scripts/test.js), refer to [API load testing guide](https://k6.io/docs/testing-guides/api-load-testing/) for more information.

Env configs are stored in the [./docker/k6/.env](./docker/k6/.env) environment configuration file, which can be referenced in by the [./docker/k6/scripts/test.js](./docker/k6/scripts/test.js).

Start tests

```bash
docker compose --project-name load -f docker-compose-load.yml up
```

Cleanup tests

```bash
docker compose --project-name load -f docker-compose-load.yml down -v
```
