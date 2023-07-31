// Main configuration for Scripts

const config = {
  // # define scenarios
  "scenarios": {
    "accountLookup": { // # original scenario for accountLookup
      "executor": "ramping-vus",
      "exec": "accountLookupScenarios",
      "startVUs": 1,
      "stages": [
        { "duration": "2m", "target": 6 },
        { "duration": "5m", "target": 6 },
        { "duration": "2m", "target": 0 }
      ]
    },
    // # Example using "ramping-arrival-rate" executor
    // "accountLookup": {
    //   "executor": "ramping-arrival-rate",
    //   "exec": "accountLookupScenarios",
    //   "preAllocatedVUs": 10,
    //   "timeUnit": "1s",
    //   "startRate": 1,
    //   "stages": [
    //     { "target": 400, "duration": "2m" },
    //     { "target": 400, "duration": "15m" },
    //     { "target": 0, "duration": "2m"},
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
