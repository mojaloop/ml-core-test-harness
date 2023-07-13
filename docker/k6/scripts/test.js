import http from 'k6/http';
import { check, sleep, crypto } from 'k6';
// import { Trace } from './utils'

export const options = {
  stages: [
    { duration: '1m', target: 20, vus: 1 },
    // { duration: '1m30s', target: 10 },
    // { duration: '20s', target: 0 },
  ],
  tags: {
    testid: `${Date.now()}`,
  },
};

console.log(`Env Vars -->
  ACCOUNT_LOOKUP_SERVICE_HOST=${__ENV.ACCOUNT_LOOKUP_SERVICE_HOST},
  ACCOUNT_LOOKUP_SERVICE_PORT=${__ENV.ACCOUNT_LOOKUP_SERVICE_PORT}
`);

const generateTrace = () => {
  // Ref: https://github.com/mojaloop/mojaloop-specification/blob/master/fspiop-api/documents/Tracing%20v1.0.md#table-2--data-model-for-tracing-values
  return `00-${crypto.randomBytes(16)}-${crypto.randomBytes(8)}-${crypto.randomBytes(1)}`
}

export default function () {
  const params = {
    headers: {
      'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
      'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
      'FSPIOP-Source': 'perffsp1',
      'Date': (new Date()).toUTCString(),
      // 'traceParent': Trace.generateTraceParent(),
      'traceState': `tx_end2end_start_ts=${Date.now()}`
    },
  };

  const res = http.get(`http://${__ENV.ACCOUNT_LOOKUP_SERVICE_HOST}:${__ENV.ACCOUNT_LOOKUP_SERVICE_PORT}/parties/MSISDN/19012345002`, params);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
