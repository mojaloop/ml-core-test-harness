import { getParties } from "../scripts/getParties.js";
import http from 'k6/http';
import exec from 'k6/execution';

export function fspiopDiscoveryScenarios() {
  getParties();
}
