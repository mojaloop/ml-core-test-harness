import http from 'k6/http';
import { crypto } from "k6/experimental/webcrypto";
import { check, group } from 'k6';
import exec from 'k6/execution';
import { Trace } from "../common/trace.js";
import { getTwoItemsFromArray } from "../common/utils.js";

console.log(`Env Vars -->
  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS},
  K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL},
  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL},
  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR}
`);

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)

const ilpPacket = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ILPPACKET
const condition = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CONDITION
const amount = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CURRENCY
const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

export function postSimpleTransfers() {
  group("Post Transfers", function () {
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

    const transferId = crypto.randomUUID();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
    const traceParent = Trace();
    const traceId = traceParent.traceId;

    const params = {
      tags: {
        payerFspId,
        payeeFspId
      },
      headers: {
        'Date': (new Date()).toUTCString(),
        'Content-Type': 'application/json',
      },
    };

    const body = {
      "fspId": payeeFspId,
      "transfersPostRequest": {
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
    }

    // Lets send the FSPIOP POST /transfers request
    const res = http.post(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/simpleTransfers`, JSON.stringify(body), params);
    check(res, { 'TRANSFERS_FSPIOP_POST_TRANSFERS_RESPONSE_IS_200' : (r) => r.status == 200 });

    if (abortOnError && res.status != 200) {
      // Abort the entire k6 test execution runner
      console.error(traceId, `FSPIOP POST /simpleTransfers returned status: ${res.status}`);
      exec.test.abort()
    }
  });
}
