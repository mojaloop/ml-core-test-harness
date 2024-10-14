module.exports = {
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
  "DATABASE": {
    "HOST": "mysql-als",
    "SCHEMA": "account_lookup"
  },
  "SWITCH_ENDPOINT": "http://central-ledger:3001"
}
