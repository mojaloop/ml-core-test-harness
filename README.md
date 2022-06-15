# Mojaloop Core test Harness

Run `Mojaloop` in your local machine using docker-compose without need for a `Kubernetes` cluster.

## Pre-requisites:
- git
- docker
- docker-compose

## Starting light weight mojaloop for a simple P2P transfer

Execute the following commands to run mojaloop in local machine

```
git clone https://github.com/mojaloop/ml-core-test-harness.git
cd ml-core-test-harness
docker-compose --profile p2p up
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

## Running P2P transfer using testing toolkit web interface

- Open the URL `http://localhost:9660` and go to `Test Runner`
- Goto on `Collection Manager` and click on the button `Import Folder`
- Select the folder `docker/ml-testing-toolkit/test-cases/collections/tests` and import
- Select `p2p.json` and click on the masked area on the right side of the screen
- Collection manager closes and click on `Run` button at the top right corner
- You should see all the tests passed
- You can explore the requests and responses by clicking on `Edit` button next to the test case

## Running various services with different profile combinations

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

### Settlements
TODO: Add settlement related services

### Bulk
TODO: Add bulk related services

### Debug
TODO: Add debug related services like kowl

### QA
TODO: Add a profile for running all tests

### All
TODO: Add a profile for running all services