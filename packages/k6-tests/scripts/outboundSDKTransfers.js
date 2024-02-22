import http from 'k6/http';
import { check, group } from 'k6';
import exec from 'k6/execution';
import { getTwoItemsFromArray } from "../common/utils.js";
import { crypto } from "k6/experimental/webcrypto";

console.log(`Env Vars -->
  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL},
  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR},
  K6_SCRIPT_SDK_ENDPOINT_URL=${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}
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

    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
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
      "homeTransactionId": "string",
      "from": {
        "type": "CONSUMER",
        "idType": "MSISDN",
        "idValue": "payerFspId",
        "displayName": "test payer",
        "firstName": "Henrik",
        "lastName": "Karlsson",
        "fspId": "string"
      },
      "to": {
        "type": "CONSUMER",
        "idType": "MSISDN",
        "idValue": crypto.randomUUID()
      },
      "amountType": "SEND",
      "currency": "AED",
      "amount": "123.45",
      "transactionType": "TRANSFER"
    }

    // Lets send the FSPIOP POST /transfers request
    const postTransferResponse = http.post(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers`, JSON.stringify(body), params);
    check(postTransferResponse, { 'TRANSFERS__POST_TRANSFERS_RESPONSE_IS_200' : (r) => r.status == 200 });

    const transferId = JSON.parse(postTransferResponse.body).transferId

    if (postTransferResponse.status == 200) {
      const putTransferacceptPartyResponse = http.put(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers/${transferId}`, JSON.stringify({
        "acceptParty": true
      }), params);
      check(putTransferacceptPartyResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_PARTY_RESPONSE_IS_200' : (r) => r.status == 200 });

      if (putTransferacceptPartyResponse.status == 200) {
        const putTransferAcceptQuoteResponse = http.put(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers/${transferId}`, JSON.stringify({
          "acceptQuote": true
        }), params);
        check(putTransferAcceptQuoteResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_QUOTE_RESPONSE_IS_200' : (r) => r.status == 200 });
      }
    }

    if (abortOnError && res.status != 200) {
      // Abort the entire k6 test exection runner
      console.error(traceId, `POST /transfers returned status: ${res.status}`);
      exec.test.abort()
    }
  });
}
