module.exports = {
  "HOSTNAME": "http://central-settlement",
  "DATABASE": {
    "HOST": "mysql"
  },
  "KAFKA": {
    "TOPIC_TEMPLATES": {
      "GENERAL_TOPIC_TEMPLATE": {
        "TEMPLATE": "topic-{{functionality}}-{{action}}",
        "REGEX": "topic-(.*)-(.*)"
      }
    },
    "CONSUMER": {
      "DEFERREDSETTLEMENT": {
        "CLOSE": {
          "config": {
            "options": {
              "mode": 2,
              "batchSize": 1,
              "pollFrequency": 10,
              "recursiveTimeout": 100,
              "messageCharset": "utf8",
              "messageAsJSON": true,
              "sync": true,
              "consumeTimeout": 1000
            },
            "rdkafkaConf": {
              "client.id": "cs-con-deferredsettlement-close",
              "group.id": "cs-group-deferredsettlement-close",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        }
      },
      "NOTIFICATION": {
        "EVENT": {
          "config": {
            "options": {
              "mode": 2,
              "batchSize": 1,
              "pollFrequency": 10,
              "recursiveTimeout": 100,
              "messageCharset": "utf8",
              "messageAsJSON": true,
              "sync": true,
              "consumeTimeout": 1000
            },
            "rdkafkaConf": {
              "client.id": "cs-con-centralsettlement-handler-deferredsettlement-notification-event",
              "group.id": "cs-group-centralsettlement-handler-deferredsettlement-notification-event",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        }
      }
    },
    "PRODUCER": {
      "NOTIFICATION": {
        "EVENT": {
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "cs-prod-centralsettlement-handler-deferredsettlement-notification-event",
              "event_cb": true,
              "compression.codec": "none",
              "retry.backoff.ms": 100,
              "message.send.max.retries": 2,
              "socket.keepalive.enable": true,
              "queue.buffering.max.messages": 10000000,
              "batch.num.messages": 100,
              "dr_cb": false,
              "socket.blocking.max.ms": 1,
              "queue.buffering.max.ms": 1,
              "broker.version.fallback": "0.10.1.0",
              "api.version.request": true
            },
            "topicConf": {
                "request.required.acks": "all",
                "partitioner": "murmur2_random"
            }
          }
        }
      },
      "DEFERREDSETTLEMENT": {
        "CLOSE": {
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "cs-prod-deferredsettlement-close",
              "event_cb": true,
              "dr_cb": true,
              "socket.keepalive.enable": true,
              "queue.buffering.max.messages": 10000000
            },
            "topicConf": {
              "request.required.acks": "all",
              "partitioner": "murmur2_random"
            }
          }
        }
      }
    }
  }
}