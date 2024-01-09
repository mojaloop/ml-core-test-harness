import http from 'k6/http';
import { check, fail, sleep, group } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout } from 'k6/experimental/timers';
import { randomItem } from "https://jslib.k6.io/k6-utils/1.1.0/index.js";
import { Trace } from "../common/trace.js";


console.log(`Env Vars -->
  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS},
  K6_SCRIPT_SDK_ENDPOINT_URL=${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL},
  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}
`);

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)

export function getParties() {
  group("Get Parties", function () {
    let payerFsp
    let payeeFsp
    if (__ENV.UNIDIRECTIONAL === "true" || __ENV.UNIDIRECTIONAL === "TRUE") {
      payerFsp = fspList[0]
      payeeFsp =  fspList[1]
    } else {
      const randomSortedFsp = fspList.concat().sort(() => randomItem([-1,1])).slice(0, 2);
      payerFsp = randomSortedFsp[0]
      payeeFsp =  randomSortedFsp[1]
    }

    const startTs = Date.now();
    const payeeId = payeeFsp['partyId'];
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
    const wsUrl = payerFsp['wsUrl'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsChannel = `${traceParent.traceId}/PUT/parties/MSISDN/${payeeId}`;
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
      check(err, { 'SDK_GET_PARTIES_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'SDK_GET_PARTIES_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
      clearTimers();
      ws.close();
      // sleep(1);
    };

    ws.onopen = () => {
      console.info(traceId, `WS open on URL: ${wsURL}`);
      const params = {
        tags: {
          payerFspId,
          payeeFspId
        },
        headers: {
          'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
          'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
          'FSPIOP-Source': payerFspId,
          'Date': (new Date()).toUTCString(),
          'traceparent': traceParent.toString(),
          'tracestate': `tx_end2end_start_ts=${startTs}`
        },
      };

      // Lets send the GET /parties request to the SDK
      const res = http.get(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/parties/MSISDN/${payeeId}`, params);
      check(res, { 'SDK_GET_PARTIES_RESPONSE_IS_202' : (r) => r.status == 202 });

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'SDK_PARTIES_SUCCESS': (cbMessage) => false });
        ws.close();
      }, wsTimeoutMs);
    };
  });
}
