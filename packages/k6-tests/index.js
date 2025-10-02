import http from 'k6/http';
import { humanizeValue, textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import { AWSConfig, S3Client } from 'https://jslib.k6.io/aws/0.14.0/s3.js';

export { fspiopDiscoveryScenarios } from './scenarios/fspiopDiscovery.js';
export { fspiopDiscoveryNoCallbackScenarios } from './scenarios/fspiopDiscoveryNoCallbackConstantRate.js';
export { fspiopTransfersScenarios } from './scenarios/fspiopTransfers.js';
export { getTransfersScenarios } from './scenarios/getTransfers.js';
export { fspiopFXTransfersScenarios } from './scenarios/fspiopFXTransfers.js';
export { fspiopTransfersNoCallbackScenarios } from './scenarios/fspiopTransfersNoCallback.js';
export { fspiopQuotesScenarios } from './scenarios/fspiopQuotes.js';
export { fspiopFXQuotesScenarios } from './scenarios/fspiopFXQuotes.js';
export { fspiopQuotesNoCallbackScenarios } from './scenarios/fspiopQuotesNoCallback.js';
export { fspiopParallelScenarios } from './scenarios/fspiopParallel.js';
export { fspiopQuotesPersonalInfoExtensionsScenarios } from './scenarios/fspiopQuotesPersonalInfoExtensions.js';
export { fspiopE2EScenarios } from './scenarios/fspiopE2E.js';
export { fxSendE2EScenarios } from './scenarios/fxSendE2E.js';
export { inboundSDKDiscoveryScenarios } from './scenarios/inboundSDKDiscovery.js';
export { inboundSDKQuotesScenarios } from './scenarios/inboundSDKQuotes.js';
export { inboundSDKTransfersScenarios } from './scenarios/inboundSDKTransfers.js';
export { outboundSDKDiscoveryScenarios } from './scenarios/outboundSDKDiscovery.js';
export { outboundSDKQuotesScenarios } from './scenarios/outboundSDKQuotes.js';
export { outboundSDKTransfersScenarios } from './scenarios/outboundSDKTransfers.js';
export { sdkFxSendE2EScenarios } from './scenarios/sdkFxSendE2E.js';
export { localhostScenarios } from './scenarios/localhost.js';

// Setup functions
import { setup as sdkFxSendE2ESetup } from './scripts/sdkFxSendE2E.js';
const setupFunctions = {
  sdkFxSendE2ESetup
}

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

const millisecondsToTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function setup() {
  const scenarios = testConfig.scenarios || {};
  const scenarioNames = Object.keys(scenarios);
  if (scenarioNames.length !== 0) {
    const execName = scenarios[scenarioNames[0]].exec;
    const setupFunction = setupFunctions[execName.replace('Scenarios', 'Setup')];
    if (setupFunction) {
      setupFunction();
    }
  }
}

export function handleSummary(data) {
  console.log('Submitting the end-of-test summary...');
  const {totalAssertions, totalPassedAssertions} = Object.values(data.metrics).reduce(
    (acc, metric) => {
      Object.values(metric.thresholds || {}).forEach(threshold => {
        acc.totalAssertions++;
        if (threshold.ok) acc.totalPassedAssertions++;
      });
      return acc;
    },
    { totalAssertions: 0, totalPassedAssertions: 0 }
  );
  const failed = totalAssertions !== totalPassedAssertions;

  const releaseCdUrl = __ENV.K6_SCRIPT_RELEASE_CD_URL;
  const testName = __ENV.K6_SCRIPT_CONFIG_FILE_NAME?.replace('.json', '') || 'k6-test';

  let report
  if (__ENV.S3_ENDPOINT && __ENV.S3_BUCKET && __ENV.S3_KEY) {
    console.log('Uploading test summary to ' + __ENV.S3_ENDPOINT);
    let summary = textSummary(data, { enableColors: false })
    const s3 = new S3Client(AWSConfig.fromEnvironment({ endpoint: __ENV.S3_ENDPOINT }))
    s3.putObject(
      __ENV.S3_BUCKET,
      __ENV.S3_KEY + '.txt',
      summary, {
        contentType: 'text/plain',
        contentLength: summary.length,
      }
    ).catch(console.error);
    report =  __ENV.K6_SCRIPT_REPORT_ENDPOINT + __ENV.S3_KEY + '.txt'
    summary = JSON.stringify(data)
    s3.putObject(
      __ENV.S3_BUCKET,
      __ENV.S3_KEY + '.json',
      summary, {
        contentType: 'application/json',
        contentLength: summary.length,
      }
    ).catch(console.error);
  }

  if (releaseCdUrl) {
    console.log('Sending summary to ReleaseCD at ' + releaseCdUrl);
    const releaseCdData = JSON.stringify({
      [`tests.${testName}`]: {
        totalAssertions,
        totalPassedAssertions,
        duration: data?.state?.testRunDurationMs,
        requests: data?.metrics?.http_reqs?.values?.count,
        iterations: data?.metrics?.values?.count,
        dataWrite: data?.metrics?.data_sent?.values?.count,
        dataRead: data?.metrics?.data_received?.values?.count,
        report,
        k6: data
      }
    });
    http.post(releaseCdUrl, releaseCdData, { headers: { 'Content-Type': 'application/json' } });
  }

  const slackUrl= __ENV.K6_SCRIPT_SLACK_URL;
  const slackErrorUrl= __ENV.K6_SCRIPT_SLACK_ERROR_URL;
  const slackPrefix = __ENV.K6_SCRIPT_SLACK_PREFIX;
  const slackSuffix = __ENV.K6_SCRIPT_SLACK_SUFFIX;
  if (slackUrl || slackErrorUrl) {
    console.log('Sending summary to Slack...');
    const slackData = JSON.stringify({
      blocks: [{
        type: 'rich_text',
        elements: [{
          type: 'rich_text_section',
          elements: [
            { type: 'text', text: `${failed ? '🔴' : '🟢'}` },
            { type: 'text', text: `${slackPrefix || ''} ${testName} VUs: ` },
            { type: 'text', text: String(data.metrics.vus.values.max), style: { code: true } },
            { type: 'text', text: ', requests: ' },
            { type: 'text', text: String(data.metrics.http_reqs.values.count), style: { code: true } },
            { type: 'text', text: ', duration: ' },
            { type: 'text', text: millisecondsToTime(data.state.testRunDurationMs), style: { code: true } },
            ...Object
              .entries(data.metrics)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([metricName, metric]) => metric.thresholds && [{
              type: 'text',
              text: `, ${metricName}: ${Object.values(metric.thresholds).some(threshold => !threshold.ok) ? '⚠️' : ''}`
            }, {
              type: 'text',
              text: String(humanizeValue('rate' in metric.values ? metric.values['rate'] : metric.values['p(95)'], metric)),
              style: { code: true }
            }]).flat(),
            slackSuffix && { type: 'text', text: ` ${slackSuffix}` }
          ].filter(Boolean),
        }]
      }]
    });
    if (slackUrl) http.post(slackUrl, slackData, { headers: { 'Content-Type': 'application/json' } });
    if (slackErrorUrl && failed) http.post(slackErrorUrl, slackData, { headers: { 'Content-Type': 'application/json' } });
  }
}
