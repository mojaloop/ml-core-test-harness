import http from 'k6/http';
import { check, fail, sleep, group } from 'k6';
import crypto from "k6/crypto";
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/experimental/timers';
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.1.0/index.js";
import { Trace } from "../common/trace.js";

console.log(`Env Vars -->
  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS},
  K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL},
  K6_SCRIPT_FSPIOP_ALS_PAYEE_PARTYID=${__ENV.K6_SCRIPT_FSPIOP_ALS_PAYEE_PARTYID},
  K6_SCRIPT_CALLBACK_HANDLER_SERVICE_WS_URL=${__ENV.K6_SCRIPT_CALLBACK_HANDLER_SERVICE_WS_URL}
`);

export function getParties() {
  group("Get Parties", function () {

    const startTs = Date.now();

    const payeeId = `${__ENV.K6_SCRIPT_FSPIOP_ALS_PAYEE_PARTYID}`;
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsChannel = `${traceParent.traceId}/PUT/parties/MSISDN/${payeeId}`;
    // TODO: Need to parameterize the following. The above line is not working somehow and need to investigate
    const wsURL = `${__ENV.K6_SCRIPT_CALLBACK_HANDLER_SERVICE_WS_URL}/${wsChannel}`
    const ws = new WebSocket(wsURL);

    // const sessionDuration = randomIntBetween(1, 1000); // user session between 5s and 1m
    // const sessionDuration = 10000; // user session between 5s and 1m
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
      check(err, { 'ALS_E2E_GET_PARTIES_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'ALS_E2E_GET_PARTIES_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
      clearTimers();
      ws.close();
      // sleep(1);
    };

    ws.onopen = () => {
      console.info(traceId, `WS open on URL: ${wsURL}`);
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

      const res = http.get(`${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL}/parties/MSISDN/${payeeId}`, params);
      check(res, { 'ALS_HTTP_SYNC_GET_PARTIES_RESPONSE_IS_202' : (r) => r.status == 202 });

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'ALS_E2E_GET_PARTIES_SUCCESS': (cbMessage) => false });
        ws.close();
      }, wsTimeoutMs);
    };
  });
}
