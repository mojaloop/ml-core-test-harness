export { accountLookupScenarios } from './scenarios/accountLookup.js';

// export testConfig from __ENV.K6_SCRIPT_CONFIG_FILE || './config/test.js';

import testConfig from './config/test.js';

// const configFile = __ENV.CONFIG_FILE || './config/test.json';
// const testConfig = JSON.parse(open(configFile));

export const options = Object.assign(
  { // default configs
    tags: {
      testid: `${Date.now()}`,
    },
  },
  testConfig() // imported config
);

// used to store global variables
globalThis.VARS = [];

// global min/max sleep durations (in seconds):
globalThis.PAUSE_MIN = __ENV.K6_SCRIPT_PAUSE_MIN || 5;
globalThis.PAUSE_MAX = __ENV.K6_SCRIPT_PAUSE_MAX || 15;

export default function() {
  console.log("No scenarios found in config/test.json. Executing default function...");
}
