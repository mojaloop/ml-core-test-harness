// Main configuration for Scripts

const config = {
  "scenarios": { // define scenarios
    "accountLookup": { // original scenaio for accountLookup
      "executor": "ramping-vus",
      "exec": "accountLookupScenarios",
      "startVUs": 1,
      "stages": [
        { "duration": "30s", "target": 1 }
        // { "duration": "5m", "target": 1 }
      ]
    },
    // "accountLookup": {
    //   "executor": "ramping-arrival-rate",
    //   "exec": "accountLookupScenarios",
    //   "preAllocatedVUs": 1,
    //   "timeUnit": "1s",
    //   "startRate": 1,
    //   "stages": [
    //     { "target": 1, "duration": "30s" },
    //     // { "target": 200, "duration": "30s" },
    //     // { "target": 200, "duration": "1m" },
    //     // { "target": 0, "duration": "30s"},
    //     // { "target": 300, "duration": "30s" },
    //     // { "target": 0, "duration": "30s"},
    //     // { "target": 100, "duration": "30s" },
    //     // { "target": 100, "duration": "2m" },
    //     // { "target": 0, "duration": "30s"},
    //     // { "target": 10000, "duration": "10m" }
    //   ]
    // }
  },
  "thresholds": {
    "iteration_duration": [ "p(95)<1000" ],
    "http_req_failed": [ "rate<0.01" ],
    "http_req_duration": [ "p(95)<1000" ]
  }
};

export default () => {
  return config;
};
