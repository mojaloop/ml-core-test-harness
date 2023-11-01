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
              "metadata.broker.list": "10.10.100.72:9092",
              "enable.auto.commit": false
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
              "metadata.broker.list": "10.10.100.72:9092"
            }
          }
        },
        "FULFIL": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "10.10.100.72:9092"
            }
          }
        },
        "GET": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "10.10.100.72:9092"
            }
          }
        }
      }
    }
  }
}
