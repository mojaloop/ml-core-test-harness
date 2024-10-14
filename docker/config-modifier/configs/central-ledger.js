module.exports = {
  "HUB_PARTICIPANT": {
    "ID": 1,
    "NAME": "Hub"
  },
  "HOSTNAME": "http://central-ledger",
  "DATABASE": {
    "HOST": "mysql"
  },
  "MONGODB": {
    "DISABLED": false,
    "HOST": "objstore",
    "PORT": 27017,
    "USER": "",
    "PASSWORD": "",
    "DATABASE": "mlos"
  },
  "PROXY_CACHE": {
    "enabled": true,
    "type": "redis",
    "proxyConfig": {
      // We need to unset cluster as there is an issue in proxy lib. The above type parameter is not being considered.
      "cluster": undefined,
      "host": "redis",
      "port": 6379,
    }
  },
  "KAFKA": {
    EVENT_TYPE_ACTION_TOPIC_MAP: {
      POSITION:{
        "PREPARE": "topic-transfer-position-batch",
        "FX_PREPARE": "topic-transfer-position-batch",
        "COMMIT": "topic-transfer-position-batch",
        "RESERVE": "topic-transfer-position-batch",
        "FX_RESERVE": "topic-transfer-position-batch",
        "TIMEOUT_RESERVED": "topic-transfer-position-batch",
        "FX_TIMEOUT_RESERVED": "topic-transfer-position-batch",
        "ABORT": "topic-transfer-position-batch",
        "FX_ABORT": "topic-transfer-position-batch"
      }
    },
    "CONSUMER": {
      "BULK": {
        "PREPARE": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "PROCESSING": {
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
      },
      "TRANSFER": {
        "PREPARE": {
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
        },
        "FULFIL": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "POSITION": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "POSITION_BATCH": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        }
      },
      "ADMIN": {
        "TRANSFER": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        }
      }
    },
    "PRODUCER": {
      "BULK": {
        "PROCESSING": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        }
      },
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
        "POSITION": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        }
      },
      "NOTIFICATION": {
        "EVENT": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        }
      },
      "ADMIN": {
        "TRANSFER": {
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
