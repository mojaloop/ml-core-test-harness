module.exports = {
  "HOSTNAME": "http://quoting-service",
  "DATABASE": {
    "HOST": "mysql"
  },
  "SIMPLE_ROUTING_MODE": false,
  "CACHE": {
    "ENUM_DATA_EXPIRES_IN_MS": 1,
    "PARTICIPANT_DATA_EXPIRES_IN_MS": 1
  },
  "SWITCH_ENDPOINT": "http://central-ledger:3001",
  "KAFKA": {
    "CONSUMER": {
      "QUOTE": {
        "POST": {
          "topic": "topic-quotes-post",
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
              "client.id": "quotes-handler-post_c",
              "group.id": "group-quotes-handler-post",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        },
        "PUT": {
          "topic": "topic-quotes-put",
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
              "client.id": "quotes-handler-put_c",
              "group.id": "group-quotes-handler-put",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        },
        "GET": {
          "topic": "topic-quotes-get",
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
              "client.id": "quotes-handler-get_c",
              "group.id": "group-quotes-handler-get",
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
      "BULK_QUOTE": {
        "POST": {
          "topic": "topic-bulkquotes-post",
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
              "client.id": "bulk-quotes-handler-post_c",
              "group.id": "group-bulk-quotes-handler-post",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        },
        "PUT": {
          "topic": "topic-bulkquotes-put",
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
              "client.id": "bulk-quotes-handler-put_c",
              "group.id": "group-bulk-quotes-handler-put",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        },
        "GET": {
          "topic": "topic-bulkquotes-get",
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
              "client.id": "bulk-quotes-handler-get_c",
              "group.id": "group-bulk-quotes-handler-get",
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
      "FX_QUOTE": {
        "POST": {
          "topic": "topic-fx-quotes-post",
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
              "client.id": "fx-quotes-handler-post_c",
              "group.id": "group-fx-quotes-handler-post",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        },
        "PUT": {
          "topic": "topic-fx-quotes-put",
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
              "client.id": "fx-quotes-handler-put_c",
              "group.id": "group-fx-quotes-handler-put",
              "metadata.broker.list": "kafka:29092",
              "socket.keepalive.enable": true,
              "allow.auto.create.topics": true
            },
            "topicConf": {
              "auto.offset.reset": "earliest"
            }
          }
        },
        "GET": {
          "topic": "topic-fx-quotes-get",
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
              "client.id": "fx-quotes-handler-get_c",
              "group.id": "group-fx-quotes-handler-get",
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
      "QUOTE": {
        "POST": {
          "topic": "topic-quotes-post",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "quotes-handler-post_p",
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
        },
        "PUT": {
          "topic": "topic-quotes-put",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "quotes-handler-put_p",
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
        },
        "GET": {
          "topic": "topic-quotes-get",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "quotes-handler-get_p",
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
      },
      "BULK_QUOTE": {
        "POST": {
          "topic": "topic-bulkquotes-post",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "bulkquotes-handler-post_p",
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
        },
        "PUT": {
          "topic": "topic-bulkquotes-put",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "bulkquotes-handler-put_p",
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
        },
        "GET": {
          "topic": "topic-bulkquotes-get",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "bulkquotes-handler-get_p",
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
      },
      "FX_QUOTE": {
        "POST": {
          "topic": "topic-fx-quotes-post",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "fx-quotes-handler-post_p",
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
        },
        "PUT": {
          "topic": "topic-fx-quotes-put",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "fx-quotes-handler-put_p",
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
        },
        "GET": {
          "topic": "topic-fx-quotes-get",
          "config": {
            "options": {
              "messageCharset": "utf8"
            },
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092",
              "client.id": "fx-quotes-handler-get_p",
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
