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
- Go to `Collection Manager` and click on the button `Import Folder`
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
| ttk-provisioning-gp | For Running golden path tests | - |
| ttk-tests-gp | TTK GP tests | - |
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

### Golden Path Tests

```bash
docker-compose --profile all-services --profile ttk-provisioning-gp --profile ttk-tests-gp up
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

### FX Tests

```
docker-compose --profile testing-toolkit --profile fx --profile ttk-provisioning-fx --profile ttk-fx-tests --profile debug up -d
```

```
docker-compose --profile testing-toolkit --profile fx --profile ttk-provisioning-fx --profile ttk-fx-tests --profile debug down -v
```

### Finance Portal

docker-compose --profile all-services --profile fx --profile finance-portal --profile ttk-provisioning-fx --profile ttk-fx-tests --profile debug up -d

## Performance Characterization - Quick Start

Run the following commands to start an end2end FX transfer load test.

```bash
docker compose --project-name monitoring -f docker-compose-monitoring.yml up -d
docker compose --project-name ml-core -f docker-compose-perf.yml --profile all-services --profile 8dfsp --profile ttk-provisioning-e2e up -d
env K6_SCRIPT_CONFIG_FILE_NAME=fxSendE2E.json docker compose --project-name load -f docker-compose-load.yml up
```

## Performance Characterization - Advanced

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

### Running Services for SDK characterization

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile sdk-scheme-adapter up -d
```

Stop Services

```bash
docker compose --project-name ml-core -f docker-compose-perf.yml --profile sdk-scheme-adapter down -v
```

#### Setting up the Inbound/Outbound Server variables
- Go to `perf.env` and comment out the inboundSDK variables. You'll need to do the same and restart the `docker-compose` in order to change test suite.

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
  {"partyId":19012345001,"fspId":"perffsp-1","wsUrl":"ws://sim-perffsp-1:3002"},
  {"partyId":19012345002,"fspId":"perffsp-2","wsUrl":"ws://sim-perffsp-2:3002"},
  {"partyId":19012345003,"fspId":"perffsp-3","wsUrl":"ws://sim-perffsp-3:3002"},
  {"partyId":19012345004,"fspId":"perffsp-4","wsUrl":"ws://sim-perffsp-4:3002"},
  {"partyId":19012345005,"fspId":"perffsp-5","wsUrl":"ws://sim-perffsp-5:3002"},
  {"partyId":19012345006,"fspId":"perffsp-6","wsUrl":"ws://sim-perffsp-6:3002"},
  {"partyId":19012345007,"fspId":"perffsp-7","wsUrl":"ws://sim-perffsp-7:3002"},
  {"partyId":19012345008,"fspId":"perffsp-8","wsUrl":"ws://sim-perffsp-8:3002"},
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
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=inboundSDKDiscovery.json docker compose --project-name load -f docker-compose-load.yml up
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=inboundSDKQuotes.json docker compose --project-name load -f docker-compose-load.yml up
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=inboundSDKTransfer.json docker compose --project-name load -f docker-compose-load.yml up
( or )
env K6_SCRIPT_CONFIG_FILE_NAME=fxSendE2E.json docker compose --project-name load -f docker-compose-load.yml up
```

Cleanup tests

```bash
docker compose --project-name load -f docker-compose-load.yml down -v
```

### SDK Security Overhead Testing

#### Regenerating Certificates

It's recommended that you do not trouble certificates and keys found in `docker/security/`.
If you do need to for whatever reason these are the steps.

From the root `ml-core-test-harness` directory. Accept all defaults and enter `y` when prompted.

- `cd docker/security/payer/jws/ && . keygen.sh && cd ../tls/ && . createSecrets.sh && cd ../../payee/jws && . keygen.sh && cd ../tls/ && . createSecrets.sh && cd ../../../../`
- `cp docker/security/payer/jws/publickey.cer docker/security/payee/jws/verification_keys/fspiopsimpayer.pem && cp docker/security/payee/jws/publickey.cer docker/security/payer/jws/verification_keys/fspiopsimpayee.pem`
- `cd docker/security/payer/tls/ && openssl ca -config openssl-clientca.cnf -policy signing_policy -extensions signing_req -out ../../payee/tls/dfsp_client_cert.pem -infiles ../../payee/tls/dfsp_client.csr && cp dfsp_server_cacert.pem ../../payee/tls/payer_server_cacert.pem && cd ../../../../`
- `cd docker/security/payee/tls/ && openssl ca -config openssl-clientca.cnf -policy signing_policy -extensions signing_req -out ../../payer/tls/dfsp_client_cert.pem -infiles ../../payer/tls/dfsp_client.csr && cp dfsp_server_cacert.pem ../../payer/tls/payee_server_cacert.pem && cd ../../../../`

Here are more verbose hands on instructions of what above commands do.

- Run `. keygen.sh` and `. createSecrets.sh` in the `/jws` and `/tls` folders respectively for both payer and payee.
- Move `payee/jws/publickey.cer` to `payer/jws/verification_keys/fspiopsimpayee.pem` and move `payer/jws/publickey.cer` to `payee/jws/verification_keys/fspiopsimpayer.pem`
- Switch directories to `docker/security/payer/tls/`
- Run `openssl ca -config openssl-clientca.cnf -policy signing_policy -extensions signing_req -out ../../payee/tls/dfsp_client_cert.pem -infiles ../../payee/tls/dfsp_client.csr`
- Switch directories to `docker/security/payee/tls/`
- Run `openssl ca -config openssl-clientca.cnf -policy signing_policy -extensions signing_req -out ../../payer/tls/dfsp_client_cert.pem -infiles ../../payer/tls/dfsp_client.csr`
- Move each others `dfsp_server_cacert.pem` into each others folder and rename to `payer_server_cacert.pem` and `payee_server_cacert.pem`

#### Starting the Security Harness

- Run `docker compose --project-name security -f docker-compose-security.yml --profile security-sdk-scheme-adapter up`


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

### Testing Performance of Remote Mojaloop Deployment

For executing performance test scenarios against a Mojaloop deployment, follow the steps below:

1. **Set Environment Variables:**
   - Set `perf.override.env` with the proper endpoints of the Mojaloop services.

2. **Customize Configurations:**
   - Edit the file `docker/ml-testing-toolkit/test-cases/environments/remote-k8s-env.json` to customize currencies and MSISDNs according to your requirements.

3. **Run Simulators and TTK Provisioning:**
   ```bash
   docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile ttk-provisioning-remote-k8s --profile oracle up -d
   ```

4. **Run Monitoring Services:**
   ```bash
   docker compose --project-name monitoring --profile transfers-test -f docker-compose-monitoring.yml up -d
   ```

5. **Execute Single Transfer Test Case:**
   ```bash
   env K6_SCRIPT_CONFIG_FILE_NAME=fspiopSingleTransfer.json docker compose --project-name load -f docker-compose-load.yml up
   ```

6. **Stop Services:**
   ```bash
   docker compose --project-name simulators -f docker-compose-perf.yml --profile 8dfsp --profile testing-toolkit --profile ttk-provisioning-remote-k8s down -v
   docker compose --project-name monitoring --profile transfers-test -f docker-compose-monitoring.yml down -v
   ```

> **Note:** The `-v` argument is optional and will delete any volume data created by the monitoring Docker Compose.

### Helper scripts ###

The following helper scripts are available to allow easier execution of repetitive tasks.
- [perf-test.sh](./perf-test.sh) - run various performance tests
- [k8s-mojaloop-perf-tuning/patch.sh](./k8s-mojaloop-perf-tuning/patch.sh) - patch k8s cluster to test with different releases and configurations

The easiest way to use these scripts is to create bash aliases for them:
```sh
alias p='./k8s-mojaloop-perf-tuning/patch.sh'
alias t='./perf-test.sh'
```

Then use one of the following commands:
- `t discovery` - Test single account discovery
- `t discoveries` - Test account discoveries
- `t discoveries rate` - Test account discoveries with ramping rates
- `t quote` - Test single quote
- `t fx quote` - Test single FX quote
- `t quotes` - Test quotes
- `t fx quotes` - Test FX quotes
- `t quotes rate` - Test quotes with ramping rates
- `t fx quotes rate` - Test FX quotes with ramping rates
- `t transfer` - Test single transfer
- `t fx transfer` - Test single FX transfer
- `t transfers` - Test transfers
- `t fx transfers` - Test FX transfers
- `t transfers rate` - Test transfers with ramping rates
- `t fx transfers rate` - Test FX transfers with ramping rates
- `t dqt rate` - Test account discoveries, quotes and transfers in parallel with constant rates
- `t dfx rate` - Test account discoveries, FX quotes and FX transfers in parallel with constant rates
- `t e2e` - Test multiple end to end
- `t e2e single` - Test single end to end
- `t sim start` - Start the simulators
- `t sim stop` - Stop the simulators
- `t sim restart` - Restart the simulators
- `t sim update` - Update the simulator images
- `p audit` - Configure direct events to Kafka without going through the sidecar, sending only audit and skipping others
- `p direct` - Configure direct events to Kafka without going through the sidecar
- `p disabled` - Configure no events to be produced
- `p schema` - Recreate central ledger schema object
- `p init` - Install RedPanda
- `p` - Restore baseline with events sent through the sidecar