import { postTransfers } from "../scripts/postTransfers.js";
import http from 'k6/http';
import exec from 'k6/execution';

export function postTransfersScenarios() {
  postTransfers();
}
