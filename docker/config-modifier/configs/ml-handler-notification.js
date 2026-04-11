module.exports = {
  "HOSTNAME": "http://ml-handler-notification",
  "ENDPOINT_SOURCE_URL": "http://central-ledger:3001",
  "ENDPOINT_HEALTH_URL": "http://central-ledger:3001/health",
  "TRANSFERS": {
    "SEND_TRANSFER_CONFIRMATION_TO_PAYEE": false
  },
  "KAFKA": {
    "CONSUMER": {
      "NOTIFICATION": {
        "EVENT": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "enable.auto.commit": false,
              "session.timeout.ms": 30000,
              "heartbeat.interval.ms": 10000,
              "max.poll.interval.ms": 300000,
              "partition.assignment.strategy": "cooperative-sticky"
            }
          }
        }
      }
    },
    "PRODUCER": {
      "TRANSFER": {
        "PREPARE": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "FULFIL": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "GET": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        }
      }
    }
  }
}
