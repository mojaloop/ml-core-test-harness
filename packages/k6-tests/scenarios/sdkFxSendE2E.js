import { sdkFxSendE2E } from "../scripts/sdkFxSendE2E.js";
import exec from 'k6/execution';

export function sdkFxSendE2EScenarios(data) {
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && console.log(`sdkFxSendE2EScenarios received data: ${data ? 'yes' : 'no'}, keys: ${Object.keys(data || {}).join(', ')}`);
  sdkFxSendE2E(data);
}
