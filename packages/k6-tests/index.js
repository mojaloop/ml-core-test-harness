export { fspiopDiscoveryScenarios } from './scenarios/fspiopDiscovery.js';
export { fspiopDiscoveryNoCallbackScenarios } from './scenarios/fspiopDiscoveryNoCallbackConstantRate.js';
export { fspiopTransfersScenarios } from './scenarios/fspiopTransfers.js';
export { fspiopTransfersNoCallbackScenarios } from './scenarios/fspiopTransfersNoCallback.js';
export { fspiopQuotesScenarios } from './scenarios/fspiopQuotes.js';
export { fspiopQuotesNoCallbackScenarios } from './scenarios/fspiopQuotesNoCallback.js';
export { fspiopParallelScenarios } from './scenarios/fspiopParallel.js';
export { fspiopQuotesPersonalInfoExtensionsScenarios } from './scenarios/fspiopQuotesPersonalInfoExtensions.js';
export { fspiopE2EScenarios } from './scenarios/fspiopE2E.js';
export { inboundSDKDiscoveryScenarios } from './scenarios/inboundSDKDiscovery.js';
export { inboundSDKQuotesScenarios } from './scenarios/inboundSDKQuotes.js';
export { inboundSDKTransfersScenarios } from './scenarios/inboundSDKTransfers.js';
export { outboundSDKDiscoveryScenarios } from './scenarios/outboundSDKDiscovery.js';
export { outboundSDKQuotesScenarios } from './scenarios/outboundSDKQuotes.js';
export { outboundSDKTransfersScenarios } from './scenarios/outboundSDKTransfers.js';

const configFolder = './' + (__ENV.K6_SCRIPT_CONFIG_FOLDER_NAME || 'config') + '/';
const configFile = configFolder + __ENV.K6_SCRIPT_CONFIG_FILE_NAME || 'test.json';
const testConfig = JSON.parse(open(configFile));

export const options = Object.assign(
  { // default configs
    tags: {
      testid: `${__ENV.K6_SCRIPT_CONFIG_FILE_NAME} ${new Date().toISOString().substring(0, 16)
        .replace('T', ' ')}`
        .replace('.json', '')
        .replace('fspiop', '')
        .trim(),
    },
  },
  testConfig
);

// used to store global variables
globalThis.VARS = [];

// global min/max sleep durations (in seconds):
globalThis.PAUSE_MIN = __ENV.K6_SCRIPT_PAUSE_MIN || 5;
globalThis.PAUSE_MAX = __ENV.K6_SCRIPT_PAUSE_MAX || 15;

export default async () => {
  console.log("No scenarios found in config/test.json. Executing default function...");
}
