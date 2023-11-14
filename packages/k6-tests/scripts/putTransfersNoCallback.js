import http from 'k6/http';
import { crypto } from "k6/experimental/webcrypto";
import { check, fail, sleep, group } from 'k6';
import { Trace } from "../common/trace.js";
import { getTwoItemsFromArray } from "../common/utils.js";

console.log(`Env Vars -->
  K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL},
  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}
`);

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)

const ilpPacket = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ILPPACKET
const condition = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CONDITION
const amount = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CURRENCY

export function putTransfersNoCallback() {
  group("Put Transfers", function () {
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
        'Accept': 'application/vnd.interoperability.transfers+json;version=1.1',
        'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.1',
        'FSPIOP-Source': payerFspId,
        'FSPIOP-Destination': payeeFspId,
        'Date': (new Date()).toUTCString(),
        'traceparent': traceParent.toString(),
        'tracestate': `tx_end2end_start_ts=${startTs}`
      },
    };
    const FULFILMENT = 'lnYe4rYwLthWbzhVyX5cAuDfL1Ulw4WdaTgyGDREysw'
    const body = {
      "transferState": "COMMITTED",
      "fulfilment": FULFILMENT,
      "completedTimestamp": (new Date()).toISOString()
    }

    // Lets send the FSPIOP PUT /transfers request
    const res = http.put(`${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL}/transfers/${transferId}`, JSON.stringify(body), params);
    check(res, { 'TRANSFERS_FSPIOP_POST_TRANSFERS_RESPONSE_IS_202' : (r) => r.status == 202 });

  });
}
