import { sdkFxSendE2EPool } from "../scripts/sdkFxSendE2EPool.js";
import exec from 'k6/execution';

export function sdkFxSendE2EPoolScenarios(data) {
  const isFirstIteration = !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1);
  if (isFirstIteration) {
    console.log(`sdkFxSendE2EPoolScenarios received data: ${data ? 'yes' : 'no'}`);
    if (data) {
      console.log(`Data keys: ${Object.keys(data).join(', ')}`);
      if (data.partiesByFsp) {
        console.log(`partiesByFsp keys: ${Object.keys(data.partiesByFsp).join(', ')}`);
      } else {
        console.log(`WARNING: data.partiesByFsp is missing or undefined!`);
      }
    } else {
      console.log(`WARNING: data is undefined or null!`);
    }
  }
  sdkFxSendE2EPool(data);
}
