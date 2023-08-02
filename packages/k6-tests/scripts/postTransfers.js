import http from 'k6/http';
import { crypto } from "k6/experimental/webcrypto";
import { check, fail, sleep, group } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/experimental/timers';
import { Trace } from "../common/trace.js";
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

console.log(`Env Vars -->
  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS},
  K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL},
  K6_SCRIPT_FSPIOP_FSP_PAYER_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_PAYER_POOL}
  K6_SCRIPT_FSPIOP_FSP_PAYEE_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_PAYEE_POOL}
`);

const payerFspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_PAYER_POOL)
const payeeFspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_PAYEE_POOL)

const ilpPacket = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ILPPACKET
const condition = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CONDITION
const amount = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CURRENCY

export function postTransfers() {
  group("Post Transfers", function () {
    const payerFsp = payerFspList[0]
    const payeeFsp =  payeeFspList[0]
    // const payerFsp = payerFspList[randomIntBetween(0, payerFspList.length-1)]
    // const payeeFsp =  payeeFspList[randomIntBetween(0, payeeFspList.length-1)]

    const startTs = Date.now();
    const transferId = crypto.randomUUID();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
    const wsUrl = payerFsp['wsUrl'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsChannel = `${traceParent.traceId}/PUT/transfers/${transferId}`;
    const wsURL = `${wsUrl}/${wsChannel}`
    const ws = new WebSocket(wsURL);
    const wsTimeoutMs = Number(__ENV.K6_SCRIPT_WS_TIMEOUT_MS) || 2000; // user session between 5s and 1m

    var wsTimeoutId = null;

    const clearTimers = () => {
      if (wsTimeoutId) { clearTimeout(wsTimeoutId); wsTimeoutId=null }
    }

    ws.onclose(() => {
      clearTimers();
    });

    ws.onerror((err) => {
      console.error(traceId, err);
      check(err, { 'TRANSFERS_E2E_FSPIOP_POST_TRANSFERS_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'TRANSFERS_E2E_FSPIOP_POST_TRANSFERS_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
      clearTimers();
      ws.close();
      // sleep(1);
    };

    ws.onopen = () => {
      console.info(traceId, `WS open on URL: ${wsURL}`);
      const params = {
        headers: {
          'Accept': 'application/vnd.interoperability.transfers+json;version=1.1',
          'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.1',
          'FSPIOP-Source': payerFspId,
          'Date': (new Date()).toUTCString(),
          'traceparent': traceParent.toString(),
          'tracestate': `tx_end2end_start_ts=${startTs}`
        },
      };

      const body = {
        "transferId": transferId,
        "payerFsp": payerFspId,
        "payeeFsp": payeeFspId,
        "amount": {
          amount,
          currency
        },
        "expiration": "2030-01-01T00:00:00.000Z",
        ilpPacket,
        condition
      }

      // Lets send the FSPIOP POST /transfers request
      const res = http.post(`${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL}/transfers`, JSON.stringify(body), params);
      check(res, { 'TRANSFERS_FSPIOP_POST_TRANSFERS_RESPONSE_IS_202' : (r) => r.status == 202 });

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'TRANSFERS_E2E_FSPIOP_POST_TRANSFERS_SUCCESS': (cbMessage) => false });
        ws.close();
      }, wsTimeoutMs);
    };
  });
}
