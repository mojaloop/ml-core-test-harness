import http from 'k6/http';
import { check, group } from 'k6';
import exec from 'k6/execution';
import { getTwoItemsFromArray } from "../common/utils.js";

console.log(`Env Vars -->
  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL},
  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR},
  K6_SCRIPT_SDK_ENDPOINT_URL=${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL},
`);

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)

const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

export function postTransfers() {
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

    const startTs = Date.now();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
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

    const body = {
      "homeTransactionId": "string",
      "from": {
        "type": "CONSUMER",
        "idType": "MSISDN",
        "idValue": payerFspId,
        "idSubValue": "string",
        "displayName": "fDg ME'iwbdzCSzVE7.TN",
        "firstName": "Henrik",
        "lastName": "Karlsson",
        "fspId": "string",
        "extensionList": [
          {
            "key": "string",
            "value": "string"
          }
        ]
      },
      "to": {
        "type": "CONSUMER",
        "idType": "MSISDN",
        "idValue": payeeFspId,
        "idSubValue": "string",
        "displayName": "eg-lcnP-wds.YiwXtbXS3",
        "firstName": "Henrik",
        "middleName": "Johannes",
        "lastName": "Karlsson",
        "fspId": "string"
      },
      "amountType": "RECEIVE",
      "currency": "AED",
      "amount": "123.45",
      "transactionType": "TRANSFER",
      "skipPartyLookup": true
    }

    // Lets send the FSPIOP POST /transfers request
    console.log('doing: ', `${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers`)
    const res = http.post(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers`, JSON.stringify(body), params);
    check(res, { 'TRANSFERS__POST_TRANSFERS_RESPONSE_IS_200' : (r) => r.status == 200 });

    if (abortOnError && res.status != 200) {
      // Abort the entire k6 test exection runner
      console.error(traceId, `POST /transfers returned status: ${res.status}`);
      exec.test.abort()
    }
  });
}
