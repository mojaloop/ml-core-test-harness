import { getPartiesNoCallback } from "../scripts/getPartiesNoCallback.js";
import http from 'k6/http';
import exec from 'k6/execution';

export function fspiopDiscoveryNoCallbackScenarios() {
  getPartiesNoCallback();
}