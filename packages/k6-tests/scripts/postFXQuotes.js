import http from 'k6/http';
// import { crypto } from "k6/experimental/webcrypto";
import { check, fail, sleep, group } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/timers';
import { Trace } from "../common/trace.js";
import { replaceHeaders } from '../common/replaceHeaders.js';
import { getTwoItemsFromArray } from "../common/utils.js";
import { ulid } from '../common/uuid.js'
import { exec, vu } from 'k6/execution';

function log() {
  console.log(`Env Vars -->`);
  console.log(`  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS}`);
  console.log(`  K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)
const amount = __ENV.K6_SCRIPT_FSPIOP_QUOTES_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_QUOTES_CURRENCY
const targetCurrency = __ENV.K6_SCRIPT_FSPIOP_QUOTES_TARGET_CURRENCY

export function postFXQuotes() {
  !exec.instance.iterationsCompleted && (vu.idInTest === 1) && log();
  group("Post FX Quotes", function () {
    let payerFsp

    if (__ENV.UNIDIRECTIONAL === "true" || __ENV.UNIDIRECTIONAL === "TRUE") {
      payerFsp = fspList[0]
    } else {
      const selectedFsps = getTwoItemsFromArray(fspList)
      payerFsp = selectedFsps[0]
    }

    const startTs = Date.now();
    // const quoteId = crypto.randomUUID();
    // const transactionId = crypto.randomUUID();
    const conversionRequestId = ulid();
    const conversionId = ulid();
    const transactionId = ulid();
    const msgId = ulid();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = 'perffxp';
    const wsUrl = payerFsp['wsUrl'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsChannel = `${traceParent.traceId}/PUT/fxQuotes/${conversionRequestId}`;
    const wsURL = `${wsUrl}/${wsChannel}`
    const ws = new WebSocket(wsURL, null, {tags: {name: 'fx quotes ws'}});
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
      check(err, { 'QUOTES_E2E_FSPIOP_POST_FX_QUOTES_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      __ENV.K6_DEBUG && console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'QUOTES_E2E_FSPIOP_POST_FX_QUOTES_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
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
        headers: replaceHeaders({
          'Accept': 'application/vnd.interoperability.fxQuotes+json;version=1.0',
          'Content-Type': 'application/vnd.interoperability.fxQuotes+json;version=1.0',
          'FSPIOP-Source': payerFspId,
          'FSPIOP-Destination': payeeFspId,
          'Date': (new Date()).toUTCString(),
          'traceparent': traceParent.toString(),
          'tracestate': `tx_end2end_start_ts=${startTs}`
        }),
      };

      const body = __ENV.API_TYPE === 'iso20022' ? {
        GrpHdr: {
          MsgId: msgId,
          CreDtTm: new Date().toISOString(),
          NbOfTxs: '1',
          SttlmInf: {
            SttlmMtd: 'CLRG'
          },
          PmtInstrXpryDtTm: '2030-01-01T00:00:00.000Z'
        },
        CdtTrfTxInf: {
          PmtId: {
            TxId: conversionRequestId,
            InstrId: transactionId,
            EndToEndId: transactionId
          },
          Dbtr: {
            FinInstnId: {
              Othr: {
                Id: payerFspId
              }
            }
          },
          UndrlygCstmrCdtTrf: {
            Dbtr: {
              Id: {
                OrgId: {
                  Othr: {
                    Id: payerFspId
                  }
                }
              }
            },
            DbtrAgt: {
              FinInstnId: {
                Othr: {
                  Id: payerFspId
                }
              }
            },
            Cdtr: {
              Id: {
                OrgId: {
                  Othr: {
                    Id: payeeFspId
                  }
                }
              }
            },
            CdtrAgt: {
              FinInstnId: {
                Othr: {
                  Id: payeeFspId
                }
              }
            },
            InstdAmt: {
              Ccy: currency,
              ActiveOrHistoricCurrencyAndAmount: `${amount}`
            }
          },
          Cdtr: {
            FinInstnId: {
              Othr: {
                Id: payeeFspId
              }
            }
          },
          IntrBkSttlmAmt: {
            Ccy: targetCurrency,
            ActiveCurrencyAndAmount: '0'
          },
          InstrForCdtrAgt: {
            InstrInf: 'SEND'
          }
        }
      } : {
        "conversionRequestId": conversionRequestId,
        "conversionTerms": {
          "conversionId": conversionId,
          "initiatingFsp" : payerFspId,
          "determiningTransferId": transactionId,
          "counterPartyFsp": payeeFspId,
          "amountType": "SEND",
          "expiration": "2030-01-01T00:00:00.000Z",
          "sourceAmount": {
            "amount": `${amount}`,
            "currency": `${currency}`
          },
          "targetAmount": {
            "currency": `${targetCurrency}`
          }
        }
      };

      // Lets send the FSPIOP POST /quotes request
      const res = http.post(`${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}/fxQuotes`, JSON.stringify(body), params);
      check(res, { 'QUOTES_FSPIOP_POST_FX_QUOTES_RESPONSE_IS_202' : (r) => r.status == 202 });

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'QUOTES_E2E_FSPIOP_POST_FX_QUOTES_SUCCESS': (cbMessage) => false });
        ws.close();
      }, wsTimeoutMs);
    };
  });
}
