import http from 'k6/http';
import { check, group } from 'k6';
import { Counter } from 'k6/metrics';
import exec from 'k6/execution';
import { getTwoItemsFromArray } from "../common/utils.js";
import { traceParent } from "../common/trace.js";
import { generateMsisdnSet, getRandomItemExcluding } from "../common/msisdnUtils.js";

// Custom counters for tracking check results with tags
const checkFailures = new Counter('check_failures');
const checkSuccesses = new Counter('check_successes');

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_SDK_FSP_POOL=${__ENV.K6_SCRIPT_SDK_FSP_POOL}`);
  console.log(`  K6_SCRIPT_ABORT_ON_ERROR=${__ENV.K6_SCRIPT_ABORT_ON_ERROR}`);
}


const fspList = JSON.parse(__ENV.K6_SCRIPT_SDK_FSP_POOL || '[]');
const idType = __ENV.K6_SCRIPT_ID_TYPE || 'MSISDN';
const msisdnLength = parseInt(__ENV.K6_SCRIPT_MSISDN_LENGTH || '12');
const interschemeDiscoveryRate = parseFloat(__ENV.K6_SCRIPT_INTERSCHEME_DISCOVERY_RATE || '0'); // e.g. 0.3 for 30%
const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

let partiesByFsp = {};

// Setup function - runs once at the beginning of the test
export function setup() {
  console.log('Generating and provisioning MSISDNs for DFSPs...');
  partiesByFsp = {};
  for (const fsp of fspList) {
    const { fspId, outboundUrl, msisdnPrefix, partyCount } = fsp;
    if (!fspId || !outboundUrl || !msisdnPrefix || !partyCount) {
      console.log(`Skipping FSP ${fspId} - missing required config (fspId, outboundUrl, msisdnPrefix, partyCount)`);
      continue;
    }
    // Generate unique MSISDNs for this DFSP
    const msisdns = generateMsisdnSet(msisdnPrefix, partyCount, msisdnLength);
    partiesByFsp[fspId] = msisdns;
    // Register each MSISDN as a party
    for (const msisdn of msisdns) {
      const startupParams = {
        tags: {
          name: 'post_accounts',
          url: `${outboundUrl}/accounts`,
          endpoint: 'accounts',
          operation: 'post_accounts'
        },
        headers: {
          'Content-Type': 'application/json',
          'Date': (new Date()).toUTCString()
        }
      };
      const startupBody = JSON.stringify([{ idType, idValue: msisdn }]);
      const startupResponse = http.post(`${outboundUrl}/accounts`, startupBody, startupParams);
      if (startupResponse.status >= 200 && startupResponse.status < 300) {
        console.log(`Account provisioning successful for FSP ${fspId} party ${msisdn}`);
      } else {
        console.log(`Account provisioning failed for FSP ${fspId} party ${msisdn} with status: ${startupResponse.status}`);
      }
    }
  }
  console.log('Completed account provisioning');
  return { partiesByFsp };
}

export function sdkFxSendE2E(testContext) {
  // testContext.partiesByFsp comes from setup()
  if (!testContext || !testContext.partiesByFsp) {
    throw new Error('Missing partiesByFsp in test context.');
  }
  const partiesByFspLocal = testContext.partiesByFsp;
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
  group("Post Transfers", function () {
    // Randomly select payer and payee DFSPs
    let payerFsp, payeeFsp;
    if (__ENV.UNIDIRECTIONAL === "true" || __ENV.UNIDIRECTIONAL === "TRUE") {
      payerFsp = fspList[0];
      payeeFsp = fspList[1];
    } else {
      const selectedFsps = getTwoItemsFromArray(fspList);
      payerFsp = selectedFsps[0];
      payeeFsp = selectedFsps[1];
    }
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
    const payerMsisdns = partiesByFspLocal[payerFspId];
    const payeeMsisdns = partiesByFspLocal[payeeFspId];
    if (!payerMsisdns || !payeeMsisdns) {
      throw new Error(`Missing MSISDNs for payer or payee DFSP: ${payerFspId}, ${payeeFspId}`);
    }
    // Decide if this transfer should use interscheme discovery or precached lookup
    let useInterschemeDiscovery = Math.random() < interschemeDiscoveryRate;
    let payeePartyId;
    if (useInterschemeDiscovery) {
      // Pick a payee MSISDN that is NOT in the payer's DFSP (simulate interscheme discovery)
      payeePartyId = getRandomItemExcluding(payeeMsisdns, new Set(payerMsisdns));
    } else {
      // Pick a payee MSISDN that is in the payer's DFSP (simulate cached/precached lookup)
      // If not possible, fallback to any payee MSISDN
      payeePartyId = getRandomItemExcluding(payeeMsisdns, new Set());
    }
    // Pick a random payer party
    const payerPartyId = getRandomItemExcluding(payerMsisdns, new Set([payeePartyId]));
    const amount = payerFsp['amount'] || '2';
    const currency = payerFsp['currency'] || 'XXX';
    const paramTags = { payerFspId, payeeFspId };
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
      checkFailures.add(1, { check_type: 'post_transfer' });
    } else {
      checkSuccesses.add(1, { check_type: 'post_transfer' });
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
        checkFailures.add(1, { check_type: 'accept_party' });
      } else {
        checkSuccesses.add(1, { check_type: 'accept_party' });
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
          checkFailures.add(1, { check_type: 'accept_conversion' });
        } else {
          checkSuccesses.add(1, { check_type: 'accept_conversion' });
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
            checkFailures.add(1, { check_type: 'accept_quote' });
          } else {
            checkSuccesses.add(1, { check_type: 'accept_quote' });
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
            checkFailures.add(1, { check_type: 'status_completed' });
          } else {
            checkSuccesses.add(1, { check_type: 'status_completed' });
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
