import http from 'k6/http';
import { check, group } from 'k6';
import { Counter } from 'k6/metrics';
import exec from 'k6/execution';
import { getTwoItemsFromArray } from "../common/utils.js";
import { traceParent } from "../common/trace.js";

// Custom error counters for tracking check failures
const checkFailures = new Counter('check_failures');
const postTransferCheckFailures = new Counter('post_transfer_check_failures');
const acceptPartyCheckFailures = new Counter('accept_party_check_failures');
const acceptConversionCheckFailures = new Counter('accept_conversion_check_failures');
const acceptQuoteCheckFailures = new Counter('accept_quote_check_failures');
const statusCompletedCheckFailures = new Counter('status_completed_check_failures');

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_SDK_FSP_POOL=${__ENV.K6_SCRIPT_SDK_FSP_POOL}`);
  console.log(`  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_SDK_FSP_POOL || '[]');
const idType = __ENV.K6_SCRIPT_ID_TYPE || 'ACCOUNT_ID';

const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

// Setup function - runs once at the beginning of the test
export function setup() {
  console.log('Making party provisioning requests to accounts endpoints...');

  // Provision accounts for all FSPs in the pool
  for (const fsp of fspList) {
    const sdkEndpointUrl = fsp['outboundUrl'];
    const partyId = fsp['partyId'];

    if (!sdkEndpointUrl || !partyId) {
      console.log(`Skipping FSP ${fsp['fspId']} - missing outboundUrl or partyId`);
      continue;
    }

    console.log(`Provisioning account for FSP ${fsp['fspId']} with partyId ${partyId}`);
    const startupParams = {
      tags: {
        name: 'post_accounts',
        url: `${sdkEndpointUrl}/accounts`,
        endpoint: 'accounts',
        operation: 'post_accounts'
      },
      headers: {
        'Content-Type': 'application/json',
        'Date': (new Date()).toUTCString()
      }
    };
    const startupBody = JSON.stringify([{"idType":idType,"idValue":partyId}]);
    const startupResponse = http.post(`${sdkEndpointUrl}/accounts`, startupBody, startupParams);

    if (startupResponse.status >= 200 && startupResponse.status < 300) {
      console.log(`Account provisioning successful for FSP ${fsp['fspId']}`);
    } else {
      console.log(`Account provisioning failed for FSP ${fsp['fspId']} with status: ${startupResponse.status}`);
    }

  }

  console.log('Completed account provisioning');
}

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
    const amount = payerFsp['amount'] || '2';
    const currency = payerFsp['currency'] || 'XXX';

    const paramTags = {
      payerFspId,
      payeeFspId
    };
    const paramHeaders = {
      'Date': (new Date()).toUTCString(),
      'Content-Type': 'application/json',
      'traceparent': traceParent()
    };

    const sdkEndpointUrl = payerFsp['outboundUrl'];

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
    const postTransferResponse = http.post(
      `${sdkEndpointUrl}/transfers`,
      JSON.stringify(body),
      {
        tags: {
          ...paramTags,
          name: 'init_transfer',
          mlTransferPhase: 'discovery',
          url: `${sdkEndpointUrl}/transfers`,
          endpoint: 'transfers',
          operation: 'post_transfers'
        },
        headers: paramHeaders
      }
    );
    // console.log('postTransferResponse', postTransferResponse)
    const postTransferCheckResult = check(postTransferResponse, { 'TRANSFERS__POST_TRANSFERS_RESPONSE_IS_200' : (r) => r.status == 200 });
    if (!postTransferCheckResult) {
      checkFailures.add(1);
      postTransferCheckFailures.add(1);
    }

    const transferId = JSON.parse(postTransferResponse.body).transferId

    if (postTransferResponse.status == 200) {
      const putTransferacceptPartyResponse = http.put(`${sdkEndpointUrl}/transfers/${transferId}`, JSON.stringify({
        "acceptParty": true
      }), {
        tags: {
          ...paramTags,
          name: 'accept_party',
          mlTransferPhase: 'fxQuotes',
          url: `${sdkEndpointUrl}/transfers/:id`,
          endpoint: 'transfers',
          operation: 'put_transfer'
        },
        headers: paramHeaders
      });
      // console.log('putTransferacceptPartyResponse', putTransferacceptPartyResponse)
      const acceptPartyCheckResult = check(putTransferacceptPartyResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_PARTY_RESPONSE_IS_200' : (r) => r.status == 200 });
      if (!acceptPartyCheckResult) {
        checkFailures.add(1);
        acceptPartyCheckFailures.add(1);
      }

      if (putTransferacceptPartyResponse.status == 200) {
        // Call acceptConversion before acceptQuote
        const putTransferAcceptConversionResponse = http.put(`${sdkEndpointUrl}/transfers/${transferId}`, JSON.stringify({
          "acceptConversion": true
        }), {
          tags: {
            ...paramTags,
            name: 'accept_conversion',
            mlTransferPhase: 'quotes',
            url: `${sdkEndpointUrl}/transfers/:id`,
            endpoint: 'transfers',
            operation: 'put_transfer'
          },
          headers: paramHeaders
        });
        // console.log('putTransferAcceptConversionResponse', putTransferAcceptConversionResponse)
        const acceptConversionCheckResult = check(putTransferAcceptConversionResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_CONVERSION_RESPONSE_IS_200' : (r) => r.status == 200 });
        if (!acceptConversionCheckResult) {
          checkFailures.add(1);
          acceptConversionCheckFailures.add(1);
        }

        if (putTransferAcceptConversionResponse.status == 200) {
          const putTransferAcceptQuoteResponse = http.put(`${sdkEndpointUrl}/transfers/${transferId}`, JSON.stringify({
            "acceptQuote": true
          }), {
            tags: {
              ...paramTags,
              name: 'accept_quote',
              mlTransferPhase: 'fxTransfersAndTransfers',
              url: `${sdkEndpointUrl}/transfers/:id`,
              endpoint: 'transfers',
              operation: 'put_transfer'
            },
            headers: paramHeaders
          });
          // console.log('putTransferAcceptQuoteResponse', putTransferAcceptQuoteResponse)
          const acceptQuoteCheckResult = check(putTransferAcceptQuoteResponse, { 'TRANSFERS__PUT_TRANSFERS_ACCEPT_QUOTE_RESPONSE_IS_200' : (r) => r.status == 200 });
          if (!acceptQuoteCheckResult) {
            checkFailures.add(1);
            acceptQuoteCheckFailures.add(1);
          }

          let statusCheckResult;
          try {
            const responseBody = JSON.parse(putTransferAcceptQuoteResponse.body);
            statusCheckResult = check(responseBody, {
              'SDK_E2E_STATUS_COMPLETED': (r) => r.currentState === "COMPLETED"
            });
          } catch (e) {
            statusCheckResult = check(null, { 'SDK_E2E_STATUS_COMPLETED': () => false });
          }
          if (!statusCheckResult) {
            checkFailures.add(1);
            statusCompletedCheckFailures.add(1);
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
