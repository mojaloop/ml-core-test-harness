import { sdkFxSendE2E } from "../scripts/sdkFxSendE2E.js";
import exec from 'k6/execution';

export function sdkFxSendE2EScenarios(data) {
  const isFirstIteration = !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1);
  if (isFirstIteration) {
    console.log(`=== SCENARIO WRAPPER START ===`);
    console.log(`sdkFxSendE2EScenarios received data: ${data ? 'yes' : 'no'}`);
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
    console.log(`=== SCENARIO WRAPPER END ===`);
  }
  sdkFxSendE2E(data);
}
