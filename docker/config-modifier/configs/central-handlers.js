module.exports = {
  "HOSTNAME": "http://central-ledger",
  "DATABASE": {
    "HOST": "mysql-cl"
  },
  "MIGRATIONS": {
    "DISABLED": true,
    "RUN_DATA_MIGRATIONS": true
  },
  "MONGODB": {
    "DISABLED": true,
    "HOST": "objstore",
    "PORT": 27017,
    "USER": "",
    "PASSWORD": "",
    "DATABASE": "mlos"
  },
  "CACHE": {
    "CACHE_ENABLED": true,
    "MAX_BYTE_SIZE": 10000000,
    "EXPIRES_IN_MS": 1000
  },
  "KAFKA": {
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
            "options": {
              "batchSize": 50
            },
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
