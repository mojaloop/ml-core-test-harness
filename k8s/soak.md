# Soak test
The goal of this test is to run the system under a heavy load for a long period of time to see how it behaves.

# Test Case 1

## Run the load for 6 hours using the below configuration:

- k6 config file: `fspiopTransfers.json`
```json
{
    "executor": "ramping-vus",
    "startVUs": 5,
    "stages": [
        { "duration": "30s", "target": 600 },
        { "duration": "1m", "target": 1000 },
        { "duration": "6h", "target": 1000 }
    ]
}
```
With the above configuration, the number of virtual users will ramp up from 5 to 600 in 30 seconds and then stay at 1000 for the next 6 hours.

- DB configuration:
  - In-memory DB is enabled

- Side cars:
  - All side cars are enabled

- Kafka topics:
  - 12 partitions, 1 replica

- Service config:
  - ![config-changes](<Screenshot 2024-03-28 104525.png>)


## Command to start the test:
```bash
env K6_SCRIPT_CONFIG_FILE_NAME=fspiopTransfers.json docker compose --project-name load -f docker-compose-load.yml up
```

## Results

- Total requests sent
  - A total of 2.4 million transfers are sent with the rate of 121 transfers per second.
- Output rate observed
  - The output rate is XXX transfers per second.
  - Performance troubleshooting dashboard
  ![perf-troubleshooting](image-3.png)
  - K6 dashboard
    ![k6](image-4.png)
- Health of Kafka Objects
  - Kafka topics
    ![topics](image.png)
  - Kafka brokers
    ![brokers](image-1.png)
  - Kafka consumers
    ![consumers](image-2.png)
  - Kafka cluster overview
    ![alt text](image-7.png)
  - Kafka topic overview
    ![alt text](image-8.png)
- Health of Longhorn Objects
  - Longhorn nodes
    ![longhorn-nodes](image-5.png)
  - Longhorn volumes
    ![longhorn-volumes](image-6.png)

