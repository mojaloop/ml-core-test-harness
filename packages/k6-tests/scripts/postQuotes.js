import http from 'k6/http';
// import { crypto } from "k6/experimental/webcrypto";
import { check, fail, sleep, group } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/timers';
import { Trace } from "../common/trace.js";
import { getTwoItemsFromArray } from "../common/utils.js";
import { ulid } from '../common/uuid.js'
import exec from 'k6/execution';

function log() {
  console.log(`Env Vars -->`);
  console.log(`  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS}`);
  console.log(`  K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)
const amount = __ENV.K6_SCRIPT_FSPIOP_QUOTES_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_QUOTES_CURRENCY

export function postQuotes() {
  !exec.instance.iterationsCompleted && log();
  group("Post Quotes", function () {
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

    const startTs = Date.now();
    // const quoteId = crypto.randomUUID();
    // const transactionId = crypto.randomUUID();
    const quoteId = ulid();
    const transactionId = ulid();
    const msgId = ulid();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
    const wsUrl = payerFsp['wsUrl'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsChannel = `${traceParent.traceId}/PUT/quotes/${quoteId}`;
    const wsURL = `${wsUrl}/${wsChannel}`
    const ws = new WebSocket(wsURL, null, {tags: {name: 'quotes ws'}});
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
      check(err, { 'QUOTES_E2E_FSPIOP_POST_QUOTES_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      __ENV.K6_DEBUG && console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'QUOTES_E2E_FSPIOP_POST_QUOTES_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
      clearTimers();
      ws.close();
      // sleep(1);
    };

    ws.onopen = () => {
      __ENV.K6_DEBUG && console.info(traceId, `WS open on URL: ${wsURL}`);
      const params = {
        tags: {
          payerFspId,
          payeeFspId
        },
        headers: {
          'accept': 'application/vnd.interoperability.iso20022.quotes+json;version=1.0',
          'Content-Type': 'application/vnd.interoperability.iso20022.quotes+json;version=1.0',
          'FSPIOP-Source': payerFspId,
          'FSPIOP-Destination': payeeFspId,
          'Date': (new Date()).toUTCString(),
          'traceparent': traceParent.toString(),
          'tracestate': `tx_end2end_start_ts=${startTs}`
        },
      };

      const body_ = {
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

      const body = {
        "GrpHdr": {
          "MsgId": msgId,
          "CreDtTm": (new Date()).toISOString(),
          "NbOfTxs": "1",
          "SttlmInf": {
            "SttlmMtd": "CLRG"
          }
        },
        "CdtTrfTxInf": {
          "PmtId": {
            "TxId": quoteId,
            "EndToEndId": transactionId
          },
          "Cdtr": {
            "Id": {
              "PrvtId": {
                "Othr": {
                  "SchmeNm": {
                    "Prtry": "ACCOUNT_ID"
                  },
                  "Id": payeeFsp['partyId']
                }
              }
            }
          },
          "CdtrAgt": {
            "FinInstnId": {
              "Othr": {
                "Id": payeeFspId
              }
            }
          },
          "Dbtr": {
            "Id": {
              "PrvtId": {
                "Othr": {
                  "SchmeNm": {
                    "Prtry": "ACCOUNT_ID"
                  },
                  "Id": payerFsp['partyId']
                }
              }
            }
          },
          "DbtrAgt": {
            "FinInstnId": {
              "Othr": {
                "Id": payeeFspId
              }
            }
          },
          "IntrBkSttlmAmt": {
            "Ccy": currency,
            "ActiveCurrencyAndAmount": `${amount}`
          },
          "Purp": {
            "Prtry": "TRANSFER"
          },
          "ChrgBr": "DEBT"
        }
      }

      // Lets send the FSPIOP POST /quotes request
      const res = http.post(`${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}/quotes`, JSON.stringify(body), params);
      check(res, { 'QUOTES_FSPIOP_POST_QUOTES_RESPONSE_IS_202' : (r) => r.status == 202 });

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'QUOTES_E2E_FSPIOP_POST_QUOTES_SUCCESS': (cbMessage) => false });
        ws.close();
      }, wsTimeoutMs);
    };
  });
}
