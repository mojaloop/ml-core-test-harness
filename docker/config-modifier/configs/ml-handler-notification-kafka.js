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
            "options": {
              "mode": 2,
              "batchSize": 4,
              "syncConcurrency": 4,
              "syncSingleMessage": true,
              "sync": true
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        }
      }
    },
    "PRODUCER": {
      "TRANSFER": {
        "PREPARE": {
          "config": {
            "options": {
              "sync": true
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "queue.buffering.max.ms": 0,
              "compression.codec": "lz4",
            }
          }
        },
        "FULFIL": {
          "config": {
            "options": {
              "sync": true
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "queue.buffering.max.ms": 0,
              "compression.codec": "lz4",
            }
          }
        },
        "GET": {
          "config": {
            "options": {
              "sync": true
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "queue.buffering.max.ms": 0,
              "compression.codec": "lz4",
            }
          }
        }
      }
    }
  }
}