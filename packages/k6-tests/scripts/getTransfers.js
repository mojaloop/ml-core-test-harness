import http from 'k6/http';
import { check, fail, sleep, group } from 'k6';
import exec from 'k6/execution';
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/timers';
import { Trace } from "../common/trace.js";
import { getTwoItemsFromArray, getRandomItemFromArray } from "../common/utils.js";
import { ulid } from '../common/uuid.js'
import { replaceHeaders } from '../common/replaceHeaders.js';
import { transfers } from '../inputs/getTransfers.js'

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS}`);
  console.log(`  K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
  console.log(`  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL || '[]');

const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

export function getTransfers() {
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
  group("Get Transfers", function () {

    const startTs = Date.now();
    const transfer = getRandomItemFromArray(transfers);
    const transferId = transfer['transferId'];
    const payerFsp = fspList.find(fsp => fsp.fspId === transfer['payer']);
    const payerFspId = payerFsp['fspId'];
    const wsUrl = payerFsp['wsUrl'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsChannel = `${traceParent.traceId}/PUT/transfers/${transferId}`;
    const wsURL = `${wsUrl}/${wsChannel}`
    const ws = new WebSocket(wsURL, null, {tags: {name: 'transfers ws'}});
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
      check(err, { 'TRANSFERS_GET_TRANSFERS_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      __ENV.K6_DEBUG && console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'TRANSFERS_GET_TRANSFERS_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
      clearTimers();
      ws.close();
      // sleep(1);
    };

    ws.onopen = () => {
      // __ENV.K6_DEBUG && console.info(traceId, `WS open on URL: ${wsURL}`);
      const params = {
        tags: {
          payerFspId
        },
        headers: replaceHeaders({
          'Accept': 'application/vnd.interoperability.transfers+json;version=1.1',
          'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.1',
          'FSPIOP-Source': payerFspId,
          'Date': (new Date()).toUTCString(),
          'traceparent': traceParent.toString(),
          'tracestate': `tx_end2end_start_ts=${startTs}`
        })
      };

      // Lets send the FSPIOP POST /transfers request
      const res = http.get(`${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL}/transfers/${transferId}`, params);
      check(res, { 'TRANSFERS_GET_TRANSFERS_RESPONSE_IS_202' : (r) => r.status == 202 });

      if (abortOnError && res.status != 202) {
        // Abort the entire k6 test exection runner
        console.error(traceId, `GET /transfers returned status: ${res.status}`);
        ws.close();
        exec.test.abort()
      }

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'TRANSFERS_GET_TRANSFERS_SUCCESS': (cbMessage) => false });
        ws.close();
        if (abortOnError) {
          // Abort the entire k6 test exection runner
          console.error(traceId, 'Aborting k6 test execution!')
          exec.test.abort()
        }
      }, wsTimeoutMs);
    };
  });
}
