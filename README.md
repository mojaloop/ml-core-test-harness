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
docker-compose up
```

Wait for some time to get all the containers up and healthy.
You can check the status of the containers using the command `docker ps`.

You should see the following output after some time. That means all your mojaloop services are up and test FSPs onboarded successfully. Now you can run a P2P transfer.

```
┌───────────────────────────────────────────────────┐
│                      SUMMARY                      │
├───────────────────┬───────────────────────────────┤
│ Total assertions  │ 84                            │
├───────────────────┼───────────────────────────────┤
│ Passed assertions │ 84                            │
├───────────────────┼───────────────────────────────┤
│ Failed assertions │ 0                             │
├───────────────────┼───────────────────────────────┤
│ Total requests    │ 82                            │
├───────────────────┼───────────────────────────────┤
│ Total test cases  │ 6                             │
├───────────────────┼───────────────────────────────┤
│ Passed percentage │ 100.00%                       │
├───────────────────┼───────────────────────────────┤
│ Started time      │ Wed, 15 Jun 2022 16:20:04 GMT │
├───────────────────┼───────────────────────────────┤
│ Completed time    │ Wed, 15 Jun 2022 16:20:13 GMT │
├───────────────────┼───────────────────────────────┤
│ Runtime duration  │ 8714 ms                       │
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
