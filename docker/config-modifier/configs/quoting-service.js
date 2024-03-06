module.exports = {
  "HOSTNAME": "http://quoting-service",
  "DATABASE": {
    "HOST": "mysql"
  },
  "SWITCH_ENDPOINT": "http://central-ledger:3001",
  "KAFKA": {
    "CONSUMER": {
      "QUOTE": {
        "POST": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "PUT": {
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
      "BULK_QUOTE": {
        "POST": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "PUT": {
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
      "FX_QUOTE": {
        "POST": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "PUT": {
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
    },
    "PRODUCER": {
      "QUOTE": {
        "POST": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "PUT": {
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
      "BULK_QUOTE": {
        "POST": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "PUT": {
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
      "FX_QUOTE": {
        "POST": {
          "config": {
            "rdkafkaConf": {
              "metadata.broker.list": "kafka:29092"
            }
          }
        },
        "PUT": {
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
