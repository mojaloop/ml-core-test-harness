import http from 'k6/http';
import { check, sleep } from 'k6';
import { crypto } from "k6/experimental/webcrypto";
import { WebSocket } from 'k6/experimental/websockets';

export const options = {
  stages: [
    { duration: '15s', target: 10, vus: 1 },
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

// Trace utilities
class TraceParent {
  traceId;
  parentId;
  traceFlags;
  constructor () {
    // Ref: https://github.com/mojaloop/mojaloop-specification/blob/master/fspiop-api/documents/Tracing%20v1.0.md#table-2--data-model-for-tracing-values
    this.traceId = crypto.randomUUID().replace(/-/g,'');
    this.parentId = crypto.randomUUID().replace(/-/g,'').substring(0,16);
    this.traceFlags = '01';
  }

  toString () {
    return `00-${this.traceId}-${this.parentId}-${this.traceFlags}`;
  };

}

export default function () {

  const payeeId = '19012345002';
  const traceParent = new TraceParent();
  const wsChannel = `${traceParent.traceId}/PUT/parties/MSISDN/${payeeId}`;
  // const ws = new WebSocket(`ws://${__ENV.CALLBACK_HANDLER_SERVICE_WS_HOST}:${__ENV.CALLBACK_HANDLER_SERVICE_WS_PORT}/${wsChannel}`);
  // TODO: Need to parameterize the following. The above line is not working somehow and need to investigate
  const ws = new WebSocket(`ws://localhost:3002/${wsChannel}`);
  
  ws.onmessage = (data) => {
    console.log('a message received');
    console.log(data);
    ws.close();
  };

  ws.onopen = () => {
    const params = {
      headers: {
        'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
        'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
        'FSPIOP-Source': 'perffsp1',
        'Date': (new Date()).toUTCString(),
        'traceParent': traceParent.toString(),
        'traceState': `tx_end2end_start_ts=${Date.now()}`
      },
    };
  
    const res = http.get(`http://${__ENV.ACCOUNT_LOOKUP_SERVICE_HOST}:${__ENV.ACCOUNT_LOOKUP_SERVICE_PORT}/parties/MSISDN/${payeeId}`, params);
    check(res, { 'http sync response status is 202': (r) => r.status == 202 });
  };

  // sleep(1);
}
