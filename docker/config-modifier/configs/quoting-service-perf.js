module.exports = {
  "HOSTNAME": "http://quoting-service",
  "DATABASE": {
    "HOST": "mysql-cl"
  },
  "SIMPLE_ROUTING_MODE": false,
  "SWITCH_ENDPOINT": "http://callback-handler-svc-cl-sim:3001/admin",
  "CACHE": {
    "EXPIRES_IN_MS": 60000
  }
}
