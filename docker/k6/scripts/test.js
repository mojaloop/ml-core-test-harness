import http from 'k6/http';
import { check, sleep } from 'k6';

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

export default function () {
  const params = {
      headers: {
        'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
        'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
        'FSPIOP-Source': 'pinkbankfsp',
        'Date': (new Date()).toUTCString()
      },
    };
  const res = http.get(`http://${__ENV.ACCOUNT_LOOKUP_SERVICE_HOST}:${__ENV.ACCOUNT_LOOKUP_SERVICE_PORT}/parties/MSISDN/27713803912`, params);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
