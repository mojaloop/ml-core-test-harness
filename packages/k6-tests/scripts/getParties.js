import http from 'k6/http';
import { check, fail, sleep, group } from 'k6';
import crypto from "k6/crypto";
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/experimental/timers';
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.1.0/index.js";
import { Trace } from "../common/trace.js";


// K6_SCRIPT_FSPIOP_ALS_PAYEE_PARTYID=${__ENV.K6_SCRIPT_FSPIOP_ALS_PAYEE_PARTYID},
// K6_SCRIPT_FSPIOP_PAYER_FSP_ID=${__ENV.K6_SCRIPT_FSPIOP_PAYER_FSP_ID},
// K6_SCRIPT_FSPIOP_PAYEE_FSP_ID=${__ENV.K6_SCRIPT_FSPIOP_PAYEE_FSP_ID},
// K6_SCRIPT_CALLBACK_HANDLER_SERVICE_WS_URL=${__ENV.K6_SCRIPT_CALLBACK_HANDLER_SERVICE_WS_URL},

console.log(`Env Vars -->
  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS},
  K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL},
  K6_SCRIPT_ADMIN_ENDPOINT_URL=${__ENV.K6_SCRIPT_ADMIN_ENDPOINT_URL},
  K6_SCRIPT_ORACLE_ENDPOINT_URL=${__ENV.K6_SCRIPT_ORACLE_ENDPOINT_URL},
  K6_SCRIPT_FSPIOP_FSP_PAYER_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_PAYER_POOL}
  K6_SCRIPT_FSPIOP_FSP_PAYEE_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_PAYEE_POOL}
`);

export function getParties() {
  group("Get Parties", function () {
    const payerFspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_PAYER_POOL)
    const payeeFspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_PAYEE_POOL)
    const payerFsp = payerFspList[Math.floor(Math.random()*payerFspList.length)]
    const payeeFsp =  payeeFspList[Math.floor(Math.random()*payeeFspList.length)]

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
      check(err, { 'ALS_E2E_FSPIOP_GET_PARTIES_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'ALS_E2E_FSPIOP_GET_PARTIES_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
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
          'FSPIOP-Source': payerFspId,
          'Date': (new Date()).toUTCString(),
          'traceparent': traceParent.toString(),
          'tracestate': `tx_end2end_start_ts=${startTs}`
        },
      };

      // // OPTIONAL: Lets send the ADMIN GET /participants request to the Central-Ledger to validate payerFspId.
      // // Useful when bypassing the ALS and testing directly against a Simulator.
      // const resAdminGetParticipantsForPayer = http.get(`${__ENV.K6_SCRIPT_ADMIN_ENDPOINT_URL}/participants/${payerFspId}`, params);
      // check(resAdminGetParticipantsForPayer, { 'ALS_ADMIN_GET_PARTICIPANTS_RESPONSE_IS_200' : (r) => r.status == 200 });

      // // OPTIONAL: Lets send the ADMIN GET /participants request to the Central-Ledger to validate payeeFspId.
      // // Useful when bypassing the ALS and testing directly against a Simulator.
      // const resAdminGetParticipantsForPayee = http.get(`${__ENV.K6_SCRIPT_ADMIN_ENDPOINT_URL}/participants/${payeeFspId}`, params);
      // check(resAdminGetParticipantsForPayee, { 'ALS_ADMIN_GET_PARTICIPANTS_RESPONSE_IS_200' : (r) => r.status == 200 });

      // // TODO: OPTIONAL: missing end-point call

      // // OPTIONAL: Lets send the ORACLE GET /participants request to the Oracle to resolve FSPID for payeeId.
      // // Useful when bypassing the ALS and testing directly against a Simulator.
      // const resOracleGetParticipantsForPayee = http.get(`${__ENV.K6_SCRIPT_ORACLE_ENDPOINT_URL}/participants/MSISDN/${payeeId}`, params);
      // check(resOracleGetParticipantsForPayee, { 'ALS_ORACLE_GET_PARTICIPANTS_RESPONSE_IS_200' : (r) => r.status == 200 });

      // Lets send the FSPIOP GET /parties request to the ALS
      const res = http.get(`${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL}/parties/MSISDN/${payeeId}`, params);
      check(res, { 'ALS_FSPIOP_GET_PARTIES_RESPONSE_IS_202' : (r) => r.status == 202 });

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'ALS_E2E_FSPIOP_GET_PARTIES_SUCCESS': (cbMessage) => false });
        ws.close();
      }, wsTimeoutMs);
    };
  });
}
