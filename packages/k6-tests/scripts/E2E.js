import http from 'k6/http';
import { check, group } from 'k6';
// import { crypto } from "k6/experimental/webcrypto";
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout } from 'k6/timers';
import { Trace } from "../common/trace.js";
import { getTwoItemsFromArray } from "../common/utils.js";
import { exec, vu } from 'k6/execution';
import { uuid } from '../common/uuid.js'

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS}`);
  console.log(`  K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_ADMIN_ENDPOINT_URL=${__ENV.K6_SCRIPT_ADMIN_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_ORACLE_ENDPOINT_URL=${__ENV.K6_SCRIPT_ORACLE_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)
const ilpPacket = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ILPPACKET
const condition = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CONDITION
const amount = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CURRENCY
const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

export function E2E() {
  (vu.idInTest === 1) && log();
  group("E2E", function () {
    let payerFsp
    let payeeFsp

    if (__ENV.UNIDIRECTIONAL === "true" || __ENV.UNIDIRECTIONAL === "TRUE") {
      payerFsp = fspList[0]
      payeeFsp =  fspList[1]
    } else {
      const selectedFsps = getTwoItemsFromArray(fspList)
      payerFsp = selectedFsps[0]
      payeeFsp =  selectedFsps[1]
    }

    const startTsParties = Date.now();
    const payeeId = payeeFsp['partyId'];
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
    const wsUrl = payerFsp['wsUrl'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsTimeoutMs = Number(__ENV.K6_SCRIPT_WS_TIMEOUT_MS) || 2000; // user session between 5s and 1m

    const wsChannelParties = `${traceParent.traceId}/PUT/parties/ACCOUNT_ID/${payeeId}`;
    const wsURLParties = `${wsUrl}/${wsChannelParties}`
    const wsParties = new WebSocket(wsURLParties, null, {tags: {name: 'e2e parties ws'}});

    var wsTimeoutId = null;

    const clearTimersParties = () => {
      if (wsTimeoutId) { clearTimeout(wsTimeoutId); wsTimeoutId=null }
    }

    wsParties.onclose(() => {
      clearTimersParties();
    });

    wsParties.onerror((err) => {
      console.error(traceId, err);
      check(err, { 'ALS_E2E_FSPIOP_GET_PARTIES_SUCCESS': (cbMessage) => false });
      clearTimersParties();
      wsParties.close();
    });

    wsParties.onmessage = (event) => {
      __ENV.K6_DEBUG && console.info(traceId, `WS message received [${wsChannelParties}]: ${event.data}`);
      check(event.data, { 'ALS_E2E_FSPIOP_GET_PARTIES_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
      clearTimersParties();
      wsParties.close();

      const startTsQuotes = Date.now();
      // const quoteId = crypto.randomUUID();
      // const transactionId = crypto.randomUUID();
      const quoteId = uuid();
      const transactionId = uuid();
      const wsChannelQuotes = `${traceParent.traceId}/PUT/quotes/${quoteId}`;
      const wsURLQuotes = `${wsUrl}/${wsChannelQuotes}`
      const wsQuotes = new WebSocket(wsURLQuotes, null, {tags: {name: 'e2e quotes ws'}});

      var wsTimeoutId = null;

      const clearTimersQuotes = () => {
        if (wsTimeoutId) { clearTimeout(wsTimeoutId); wsTimeoutId=null }
      }

      wsQuotes.onclose(() => {
        clearTimersQuotes();
      });

      wsQuotes.onerror((err) => {
        console.error(traceId, err);
        check(err, { 'QUOTES_E2E_FSPIOP_POST_QUOTES_SUCCESS': (cbMessage) => false });
        clearTimersQuotes();
        wsQuotes.close();
      });

      wsQuotes.onmessage = (event) => {
        __ENV.K6_DEBUG && console.info(traceId, `WS message received [${wsChannelQuotes}]: ${event.data}`);
        check(event.data, { 'QUOTES_E2E_FSPIOP_POST_QUOTES_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
        clearTimersQuotes();
        wsQuotes.close();

        const startTsTransfers = Date.now();
        // const transferId = crypto.randomUUID();
        const transferId = uuid();
        const wsChannelTransfers = `${traceParent.traceId}/PUT/transfers/${transferId}`;
        const wsURLTransfers = `${wsUrl}/${wsChannelTransfers}`
        const wsTransfers = new WebSocket(wsURLTransfers, null, {tags: {name: 'e2e transfers ws'}});

        var wsTimeoutId = null;

        const clearTimersTransfers = () => {
          if (wsTimeoutId) { clearTimeout(wsTimeoutId); wsTimeoutId=null }
        }

        wsTransfers.onclose(() => {
          clearTimersTransfers();
        });

        wsTransfers.onerror((err) => {
          console.error(traceId, err);
          check(err, { 'TRANSFERS_E2E_FSPIOP_POST_TRANSFERS_SUCCESS': (cbMessage) => false });
          clearTimersTransfers();
          wsTransfers.close();
        });

        wsTransfers.onmessage = (event) => {
          __ENV.K6_DEBUG && console.info(traceId, `WS message received [${wsChannelTransfers}]: ${event.data}`);
          check(event.data, { 'TRANSFERS_E2E_FSPIOP_POST_TRANSFERS_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
          clearTimersTransfers();
          wsTransfers.close();
        };

        wsTransfers.onopen = () => {
          __ENV.K6_DEBUG && console.info(traceId, `WS open on URL: ${wsUrl}`);
          const params = {
            tags: {
              payerFspId,
              payeeFspId
            },
            headers: {
              'Accept': 'application/vnd.interoperability.transfers+json;version=1.1',
              'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.1',
              'FSPIOP-Source': payerFspId,
              'FSPIOP-Destination': payeeFspId,
              'Date': (new Date()).toUTCString(),
              'traceparent': traceParent.toString(),
              'tracestate': `tx_end2end_start_ts=${startTsTransfers}`
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

          if (abortOnError && res.status != 202) {
            // Abort the entire k6 test execution runner
            console.error(traceId, `FSPIOP POST /transfers returned status: ${res.status}`);
            wsTransfers.close();
            exec.test.abort()
          }

          wsTimeoutId = setTimeout(() => {
            const errorMsg = `WS timed-out on URL: ${wsURLTransfers}`
            console.error(traceId, errorMsg);
            check(res, { 'TRANSFERS_E2E_FSPIOP_POST_TRANSFERS_SUCCESS': (cbMessage) => false });
            wsTransfers.close();
            if (abortOnError) {
              // Abort the entire k6 test execution runner
              console.error(traceId, 'Aborting k6 test execution!')
              exec.test.abort()
            }
          }, wsTimeoutMs);
        };
      };

      wsQuotes.onopen = () => {
        __ENV.K6_DEBUG && console.info(traceId, `WS open on URL: ${wsURLQuotes}`);
        const params = {
          tags: {
            payerFspId,
            payeeFspId
          },
          headers: {
            'accept': 'application/vnd.interoperability.quotes+json;version=1.0',
            'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
            'FSPIOP-Source': payerFspId,
            'FSPIOP-Destination': payeeFspId,
            'Date': (new Date()).toUTCString(),
            'traceparent': traceParent.toString(),
            'tracestate': `tx_end2end_start_ts=${startTsQuotes}`
          },
        };

        const body = {
          "quoteId": quoteId,
          "transactionId": transactionId,
          "payer": {
            "partyIdInfo": {
              "partyIdType": "ACCOUNT_ID",
              "partyIdentifier": `${payerFsp['partyId']}`,
              "fspId": payerFspId
            }
          },
          "payee": {
            "partyIdInfo": {
              "partyIdType": "ACCOUNT_ID",
              "partyIdentifier": `${payeeFsp['partyId']}`,
              "fspId": payeeFspId
            }
          },
          "amountType": "SEND",
          "amount": {
            "amount": `${amount}`,
            "currency": `${currency}`
          },
          "transactionType": {
            "scenario": "TRANSFER",
            "initiator": "PAYER",
            "initiatorType": "CONSUMER"
          }
        }

        // Lets send the FSPIOP POST /quotes request
        const res = http.post(`${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}/quotes`, JSON.stringify(body), params);
        check(res, { 'QUOTES_FSPIOP_POST_QUOTES_RESPONSE_IS_202' : (r) => r.status == 202 });

        wsTimeoutId = setTimeout(() => {
          const errorMsg = `WS timed-out on URL: ${wsURLQuotes}`
          console.error(traceId, errorMsg);
          check(res, { 'QUOTES_E2E_FSPIOP_POST_QUOTES_SUCCESS': (cbMessage) => false });
          wsQuotes.close();
        }, wsTimeoutMs);
      };
    };

    wsParties.onopen = () => {
      __ENV.K6_DEBUG && console.info(traceId, `WS open on URL: ${wsURLParties}`);
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
          'tracestate': `tx_end2end_start_ts=${startTsParties}`
        },
      };

      const res = http.get(`${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL}/parties/ACCOUNT_ID/${payeeId}`, params);
      check(res, { 'ALS_FSPIOP_GET_PARTIES_RESPONSE_IS_202' : (r) => r.status == 202 });

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURLParties}`
        console.error(traceId, errorMsg);
        check(res, { 'ALS_E2E_FSPIOP_GET_PARTIES_SUCCESS': (cbMessage) => false });
        wsParties.close();
      }, wsTimeoutMs);
    };
  });
}
