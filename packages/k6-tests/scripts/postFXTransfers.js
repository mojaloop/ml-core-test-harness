import http from 'k6/http';
import { check, fail, sleep, group } from 'k6';
import exec from 'k6/execution';
import { WebSocket } from 'k6/experimental/websockets';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'k6/timers';
import { Trace } from "../common/trace.js";
import { replaceHeaders } from '../common/replaceHeaders.js';
import { getTwoItemsFromArray } from "../common/utils.js";
import { ulid } from '../common/uuid.js'

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS}`);
  console.log(`  K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
  console.log(`  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL || '[]');

const ilpPacket = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ILPPACKET
const condition = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CONDITION
const amount = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_AMOUNT?.toString() || '2'
const currency = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CURRENCY
const targetCurrency = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_TARGET_CURRENCY
const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

export function postFXTransfers() {
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
  group("Post FX Transfers", function () {
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
    // const transferId = crypto.randomUUID();
    const commitRequestId = ulid();
    const determiningTransferId = ulid();
    const msgId = ulid();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = 'perffxp';
    const wsUrl = payerFsp['wsUrl'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;
    const wsChannel = `${traceParent.traceId}/PUT/fxTransfers/${commitRequestId}`;
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
      check(err, { 'TRANSFERS_E2E_FSPIOP_POST_FX_TRANSFERS_SUCCESS': (cbMessage) => false });
      clearTimers();
      ws.close();
    });

    ws.onmessage = (event) => {
      __ENV.K6_DEBUG && console.info(traceId, `WS message received [${wsChannel}]: ${event.data}`);
      check(event.data, { 'TRANSFERS_E2E_FSPIOP_POST_FX_TRANSFERS_SUCCESS': (cbMessage) => cbMessage == 'SUCCESS_CALLBACK_RECEIVED' });
      clearTimers();
      ws.close();
      // sleep(1);
    };

    ws.onopen = () => {
      // __ENV.K6_DEBUG && console.info(traceId, `WS open on URL: ${wsURL}`);
      const params = {
        tags: {
          payerFspId,
          payeeFspId
        },
        headers: replaceHeaders({
          'Accept': 'application/vnd.interoperability.fxTransfers+json;version=1.1',
          'Content-Type': 'application/vnd.interoperability.fxTransfers+json;version=1.1',
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
            TxId: commitRequestId,
            EndToEndId: determiningTransferId
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
            ActiveCurrencyAndAmount: `${amount}`
          },
          VrfctnOfTerms: {
            Sh256Sgntr: condition
          }
        }
      } : {
        "commitRequestId": commitRequestId,
        "determiningTransferId": determiningTransferId,
        "initiatingFsp": payerFspId,
        "counterPartyFsp": payeeFspId,
        "sourceAmount": {
          amount,
          currency
        },
        "targetAmount": {
          amount,
          currency: targetCurrency
        },
        "expiration": "2030-01-01T00:00:00.000Z",
        condition
      }

      // Lets send the FSPIOP POST /transfers request
      const res = http.post(`${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL}/fxTransfers`, JSON.stringify(body), params);
      check(res, { 'TRANSFERS_FSPIOP_POST_FX_TRANSFERS_RESPONSE_IS_202' : (r) => r.status == 202 });

      if (abortOnError && res.status != 202) {
        // Abort the entire k6 test exection runner
        console.error(traceId, `FSPIOP POST /fxTransfers returned status: ${res.status}`);
        ws.close();
        exec.test.abort()
      }

      wsTimeoutId = setTimeout(() => {
        const errorMsg = `WS timed-out on URL: ${wsURL}`
        console.error(traceId, errorMsg);
        check(res, { 'TRANSFERS_E2E_FSPIOP_POST_FX_TRANSFERS_SUCCESS': (cbMessage) => false });
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
