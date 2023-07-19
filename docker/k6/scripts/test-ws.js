import http from 'k6/http';
import { check, sleep } from 'k6';
import crypto from "k6/crypto";
import { WebSocket } from 'k6/experimental/websockets';
// import { Trend, Rate } from 'k6/metrics';

// const myTrend = new Trend('waiting_time', isTime=true);
// const myTrend = new Trend('waiting_time', true);

// const myRate = new Trend('rate_time');

export const options = {
  stages: [
    { duration: '3m', target: 1, vus: 1 },
    // { duration: '1m30s', target: 10 },
    // { duration: '20s', target: 0 },
  ],
  tags: {
    testid: `${Date.now()}`,
  },
  thresholds: { // Ref: https://k6.io/docs/using-k6/workaround-to-calculate-iteration_duration/
    'iteration_duration{scenario:default}': [`max>=0`],
    'iteration_duration{group:::setup}': [`max>=0`],
    'iteration_duration{group:::teardown}': [`max>=0`],
    'http_req_duration{scenario:default}': [`max>=0`],
  },
};

console.log(`Env Vars -->
  ACCOUNT_LOOKUP_SERVICE_HOST=${__ENV.ACCOUNT_LOOKUP_SERVICE_HOST},
  ACCOUNT_LOOKUP_SERVICE_PORT=${__ENV.ACCOUNT_LOOKUP_SERVICE_PORT}
`);

// Precomputed Hex Octets w/ for Loop (Fastest/Baseline)
const byteToHex = [];
for (let n = 0; n <= 0xff; ++n)
{
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
}
function hex(arrayBuffer)
{
    const buff = new Uint8Array(arrayBuffer);
    const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

    for (let i = 0; i < buff.length; ++i)
        hexOctets.push(byteToHex[buff[i]]);

    return hexOctets.join("");
}

// Trace utilities
class TraceParent {
  traceId;
  parentId;
  traceFlags;
  constructor () {
    // Ref: https://github.com/mojaloop/mojaloop-specification/blob/master/fspiop-api/documents/Tracing%20v1.0.md#table-2--data-model-for-tracing-values
    this.traceId = hex(crypto.randomBytes(16));
    this.parentId = hex(crypto.randomBytes(8));
    this.traceFlags = '01';
  }

  toString () {
    return `00-${this.traceId}-${this.parentId}-${this.traceFlags}`;
  };

}

export default function () {
  const startTs = Date.now();

  const payeeId = '19012345002';
  const traceParent = new TraceParent();
  const wsChannel = `${traceParent.traceId}/PUT/parties/MSISDN/${payeeId}`;
  // const ws = new WebSocket(`ws://${__ENV.CALLBACK_HANDLER_SERVICE_WS_HOST}:${__ENV.CALLBACK_HANDLER_SERVICE_WS_PORT}/${wsChannel}`);
  // TODO: Need to parameterize the following. The above line is not working somehow and need to investigate
  const ws = new WebSocket(`ws://callback-handler-svc:3002/${wsChannel}`);
  
  ws.onmessage = (data) => {
    // const deltaTs = Date.now() - startTs
    // myTrend.add(deltaTs);
    // myRate.add(deltaTs)
    console.log('a message received');
    // console.log(deltaTs);
    ws.close();
    // sleep(1);
  };

  ws.onopen = () => {
    const params = {
      headers: {
        'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
        'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
        'FSPIOP-Source': 'perffsp1',
        'Date': (new Date()).toUTCString(),
        'traceparent': traceParent.toString(),
        'tracestate': `tx_end2end_start_ts=${startTs}`
      },
    };
  
    const res = http.get(`http://${__ENV.ACCOUNT_LOOKUP_SERVICE_HOST}:${__ENV.ACCOUNT_LOOKUP_SERVICE_PORT}/parties/MSISDN/${payeeId}`, params);
    check(res, { 'http sync response status is 202': (r) => r.status == 202 });
  };
}
