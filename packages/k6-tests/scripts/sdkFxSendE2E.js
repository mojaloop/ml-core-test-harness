import http from 'k6/http';
import { check, group } from 'k6';
import exec from 'k6/execution';
import { getTwoItemsFromArray } from "../common/utils.js";

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
  console.log(`  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR}`);
  console.log(`  K6_SCRIPT_SDK_ENDPOINT_URL=${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_SDK_FSP_POOL || '[]');
const idType = __ENV.K6_SCRIPT_ID_TYPE || 'ACCOUNT_ID';
const amount = __ENV.K6_SCRIPT_FX_E2E_SOURCE_AMOUNT?.toString() || '2'
const currency = __ENV.K6_SCRIPT_FX_E2E_SOURCE_CURRENCY
// const targetAmount = __ENV.K6_SCRIPT_FX_E2E_TARGET_AMOUNT?.toString() || '2'
// const targetCurrency = __ENV.K6_SCRIPT_FX_E2E_TARGET_CURRENCY

const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

export function sdkFxSendE2E() {
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
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
    const payerPartyId = payerFsp['partyId'];
    const payeePartyId = payeeFsp['partyId'];

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
        "idType": idType,
        "idValue": payerPartyId,
        "displayName": "test payer",
        "firstName": "Henrik",
        "lastName": "Karlsson",
        "fspId": payerFspId
      },
      "to": {
        "type": "CONSUMER",
        "idType": idType,
        "idValue": payeePartyId
      },
      "amountType": "SEND",
      "currency": currency,
      "amount": amount,
      "transactionType": "TRANSFER"
    }

    // Lets send the FSPIOP POST /transfers request
    const postTransferResponse = http.post(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers`, JSON.stringify(body), params);
    console.log('postTransferResponse', postTransferResponse)
    check(postTransferResponse, { 'TRANSFERS__POST_TRANSFERS_RESPONSE_IS_200' : (r) => r.status == 200 });

    const transferId = JSON.parse(postTransferResponse.body).transferId

    if (postTransferResponse.status == 200) {
      const putTransferacceptPartyResponse = http.put(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers/${transferId}`, JSON.stringify({
        "acceptParty": true
      }), params);
      console.log('putTransferacceptPartyResponse', putTransferacceptPartyResponse)
      check(putTransferacceptPartyResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_PARTY_RESPONSE_IS_200' : (r) => r.status == 200 });

      if (putTransferacceptPartyResponse.status == 200) {
        // Call acceptConversion before acceptQuote
        const putTransferAcceptConversionResponse = http.put(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers/${transferId}`, JSON.stringify({
          "acceptConversion": true
        }), params);
        console.log('putTransferAcceptConversionResponse', putTransferAcceptConversionResponse)
        check(putTransferAcceptConversionResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_CONVERSION_RESPONSE_IS_200' : (r) => r.status == 200 });

        if (putTransferAcceptConversionResponse.status == 200) {
          const putTransferAcceptQuoteResponse = http.put(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/transfers/${transferId}`, JSON.stringify({
            "acceptQuote": true
          }), params);
          console.log('putTransferAcceptQuoteResponse', putTransferAcceptQuoteResponse)
          check(putTransferAcceptQuoteResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_QUOTE_RESPONSE_IS_200' : (r) => r.status == 200 });

          try {
            const responseBody = JSON.parse(putTransferAcceptQuoteResponse.body);
            check(responseBody, {
              'SDK_E2E_STATUS_COMPLETED': (r) => r.currentState === "COMPLETED"
            });
          } catch (e) {
            check(null, { 'SDK_E2E_STATUS_COMPLETED': () => false });
          }
        }
      }
    }

    if (abortOnError && res.status != 200) {
      // Abort the entire k6 test exection runner
      console.error(traceId, `POST /transfers returned status: ${res.status}`);
      exec.test.abort()
    }
  });
}
