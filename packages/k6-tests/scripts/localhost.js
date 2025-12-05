import { check, group, sleep } from 'k6';
import http from 'k6/http';
import exec from 'k6/execution';
import { traceParent } from "../common/trace.js";

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_ENDPOINT_URL=${__ENV.K6_SCRIPT_ENDPOINT_URL},`);
}

export function localhost() {
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
  group('Local test', function () {
    let res = http.get(__ENV.K6_SCRIPT_ENDPOINT_URL || 'http://127.0.0.1:8080');
    traceParent();
    check(res, { 'status was 200': (r) => r.status == 200 });
    sleep(0.095);
  });
}
