# Mojaloop Core test Harness

Run `Mojaloop` in your local machine using docker-compose without need for a `Kubernetes` cluster.

## Pre-requisites

- git
- docker
- docker-compose

## Starting mojaloop core services for a simple P2P transfer

Execute the following commands to run mojaloop in local machine

```bash
git clone https://github.com/mojaloop/ml-core-test-harness.git
cd ml-core-test-harness
docker-compose --profile all-services --profile ttk-provisioning --profile ttk-tests up
```

Wait for some time to get all the containers up and healthy.
You can check the status of the containers using the command `docker ps`.

You should see the following output after some time. That means all your mojaloop services are up and test FSPs are onboarded successfully. Now you can run a P2P transfer.

```log
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

```bash
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

```bash
docker-compose --profile all-services up
```

### Core services with debug utilities

```bash
docker-compose --profile all-services --profile debug up
```

### Central ledger

```bash
docker-compose --profile central-ledger up
```

### Quoting Service

```bash
docker-compose --profile quoting-service --profile central-ledger up
```

Note: We need to include central-ledger profile also here because its a dependency for quoting service

### Account lookup service

```bash
docker-compose --profile account-lookup-service --profile central-ledger up
```

Note: We need to include central-ledger profile also here because its a dependency for account lookup service

### ML API Adapter

```bash
docker-compose --profile ml-api-adapter --profile central-ledger up
```

Note: We need to include central-ledger profile also here because its a dependency for ml-api-adapter

### Discovery

```bash
docker-compose --profile discovery up
```

### Agreement

```bash
docker-compose --profile agreement up
```

### Transfer

```bash
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

## Performance Characterization

### Running ALS with dependencies

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile als-test --profile ttk-provisioning-als up -d
```

Stop Services

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile als-test down -v
```

> NOTE: `-v` argument is optional, and it will delete any volume data created by the monitoring docker compose

### Running Services for Transfers characterization

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile transfers-test --profile 8dfsp --profile ttk-provisioning-transfers up -d
```

Stop Services

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile transfers-test --profile 8dfsp down -v
```

> NOTE: `-v` argument is optional, and it will delete any volume data created by the monitoring docker compose


### Running Services for Quotes characterization

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile quotes-test --profile 8dfsp --profile ttk-provisioning-quotes up -d
```

Stop Services

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile quotes-test --profile 8dfsp down -v
```

> NOTE: `-v` argument is optional, and it will delete any volume data created by the monitoring docker compose

### Running Services for Full E2E (Discovery+Agreement+Transfers) characterization

- Set `ALS_SWITCH_ENDPOINT` to "http://central-ledger:3001" in perf.env
- Set `QS_SWITCH_ENDPOINT` to "http://central-ledger:3001" in perf.env

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile all-services --profile 8dfsp --profile ttk-provisioning-e2e up -d
```

Stop Services

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile all-services --profile 8dfsp down -v
```

> NOTE: `-v` argument is optional, and it will delete any volume data created by the monitoring docker compose

### Configuration for Transfers with batch support
- Set CENTRAL_LEDGER_POSITION_BATCH_REPLICAS to desired count in `.env` file
- Enable line `CLEDG_KAFKA__EVENT_TYPE_ACTION_TOPIC_MAP__POSITION__PREPARE=topic-transfer-position-batch` in `perf.env` file
- Set `CENTRAL_LEDGER_VERSION` to `v17.2.0` or higher

### Monitoring

Start Monitoring Services stack which uses:

- [Prometheus](https://prometheus.io) for time series data store
- [Grafana](https://grafana.com/) for visualization dashboards
- [Node Exporter](https://github.com/prometheus/node_exporter) to instrument the Host machine
- [CAdviser](https://github.com/google/cadvisor) to instrument the Docker containers running on Host machine

```bash
docker compose --project-name monitoring -f docker-compose-monitoring.yml up -d
```

Stop Monitoring Services

```bash
docker compose --project-name monitoring --profile als-test --profile transfers-test -f docker-compose-monitoring.yml down -v
```

Start monitoring with account lookup service mysql exporter

```bash
docker compose --project-name monitoring --profile als-test -f docker-compose-monitoring.yml up -d
```

Start monitoring with central ledger mysql exporter

```bash
docker compose --project-name monitoring --profile transfers-test -f docker-compose-monitoring.yml up -d
```

or

```bash
docker compose --project-name monitoring --profile quotes-test -f docker-compose-monitoring.yml up -d
```

since the quoting service uses the central ledger database.

Start monitoring with all exporters

```bash
docker compose --project-name monitoring --profile als-test --profile quotes-test --profile transfers-test -f docker-compose-monitoring.yml up -d
```


> NOTE: `-v` argument is optional, and it will delete any volume data created by the monitoring docker compose

TODO:

- add note about network being created by docker-compose-perf.yml, or it can be done manually.

### Load Tests

[K6](https://k6.io) is being used to execute performance tests, with metrics being captured by [Prometheus](https://k6.io/docs/results-output/real-time/prometheus-remote-write) and displayed using [Grafana](https://k6.io/docs/results-output/real-time/prometheus-remote-write/#time-series-visualization).

Tests can be defined in the [./packages/k6-tests/scripts/test.js](./packages/k6-tests/scripts/test.js), refer to [API load testing guide](https://k6.io/docs/testing-guides/api-load-testing/) for more information.

Env configs are stored in the [./perf.env](./perf.env) environment configuration file..

Note: Transfer testing and quote testing

Depending on the profile you started the performance docker compose with i.e `--profile transfers-test --profile {2/4/8}dfsp`
You will need to edit `K6_SCRIPT_FSPIOP_FSP_POOL` json string in `./perf.env` to contain 2/4/8 dfsps depending on your test.
For reference here are the provisioned dfsps with an associated partyId available for use.

```json
[
  {"partyId":19012345001,"fspId":"perffsp1","wsUrl":"ws://sim-perffsp1:3002"},
  {"partyId":19012345002,"fspId":"perffsp2","wsUrl":"ws://sim-perffsp2:3002"},
  {"partyId":19012345003,"fspId":"perffsp3","wsUrl":"ws://sim-perffsp3:3002"},
  {"partyId":19012345004,"fspId":"perffsp4","wsUrl":"ws://sim-perffsp4:3002"},
  {"partyId":19012345005,"fspId":"perffsp5","wsUrl":"ws://sim-perffsp5:3002"},
  {"partyId":19012345006,"fspId":"perffsp6","wsUrl":"ws://sim-perffsp6:3002"},
  {"partyId":19012345007,"fspId":"perffsp7","wsUrl":"ws://sim-perffsp7:3002"},
  {"partyId":19012345008,"fspId":"perffsp8","wsUrl":"ws://sim-perffsp8:3002"},
]
```

Start tests

```bash
env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfers.json docker compose --project-name load -f docker-compose-load.yml up
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfersUnidirectional.json docker compose --project-name load -f docker-compose-load.yml up
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=fspiopDiscovery.json docker compose --project-name load -f docker-compose-load.yml up
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=fspiopQuotes.json docker compose --project-name load -f docker-compose-load.yml up
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=fspiopE2E.json docker compose --project-name load -f docker-compose-load.yml up
```

Cleanup tests

```bash
docker compose --project-name load -f docker-compose-load.yml down -v
```

### Automate Load Tests

This section describes the process to automate capturing of grafana rendered dashboards after running the performance testing scenarios.

The main script that contains the logic for this is automate_perf.sh. Before running this script, the required variables are provided as environment variables that are defined in automate_perf.env. As this file contains login credentials, to avoid credential exposure a sample file called automate_perf_sample.env is available at the root level. Make a copy of this file, rename it to automate_perf.env and update the variable values.

Once automate_perf.env is ready, the next step is to make sure that the services for test harness and monitoring are up and running. The relevant docker-compose commands for these 2 steps are listed above in Performance Characterization section.

Once the required services are up and running, run automate_perf.sh from terminal. Once the script is completed successfully, a results folder is created at the main root level. In there another folder based on date is created and it creates subfolders for the different scenarios that are executed. The different dashboards that will be collected are specified in the script itself.

Run the script:

```bash
./automate_perf.sh
```

To capture results without running tests, use the following command

```bash
./automate_perf.sh -c -f <From Time in Milliseconds> -t <To time in Milliseconds>
```


## Test Notes

### On load and monitoring machine
```
docker compose --project-name monitoring  -f docker-compose-monitoring.yml up -d

docker compose --project-name ml-core -f docker-compose-perf.yml --profile 8dfsp up -d
```

### On ALS, Quotes machine

```
docker compose --project-name ml-core -f docker-compose-perf.yml --profile als-test --profile quotes-test up -d

docker compose --project-name ml-core -f docker-compose-perf.yml --profile als-test --profile quotes-test down -v
```

