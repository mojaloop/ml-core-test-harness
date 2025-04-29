module.exports = { 
  "HOSTNAME": "http://ml-api-adapter",
  "ENDPOINT_SOURCE_URL": "http://central-ledger:3001",
  "ENDPOINT_HEALTH_URL": "http://central-ledger:3001/health",
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
  "ENDPOINT_SECURITY":{                                                
    "JWS": {                                                         
      "JWS_SIGN": true,                                              
      "JWS_SIGNING_KEY_PATH": "secrets/jwsSigningKey.key"            
    },                                                               
    "TLS": {                                                         
        "rejectUnauthorized": true                                   
    }                                                                
  }, 
  "KAFKA": {
    "CONSUMER": {
      "NOTIFICATION": {
        "EVENT": {
          "config": {
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
