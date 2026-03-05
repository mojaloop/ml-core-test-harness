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
const rawInterschemeDiscoveryRate = parseFloat(__ENV.K6_SCRIPT_INTERSCHEME_DISCOVERY_RATE || '0');
const interschemeDiscoveryRate = (function () {
  if (isNaN(rawInterschemeDiscoveryRate)) {
    return 0;
  }
  let value = rawInterschemeDiscoveryRate;
  // Support both normalized probabilities (e.g. 0.3) and percentages (e.g. 30 for 30%)
  if (value > 1) {
    value = value / 100;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
})();
const abortOnError = (__ENV.K6_SCRIPT_ABORT_ON_ERROR && __ENV.K6_SCRIPT_ABORT_ON_ERROR.toLowerCase() === 'true') ? true : false

let usedPayees = new Set(); // Track MSISDNs that have been used as payees

// Setup function - runs once at the beginning of the test
export function setup() {
  console.log('!!!!! sdkFxSendE2EPoolSetup FUNCTION CALLED !!!!!');
  try {
    console.log('=== SETUP FUNCTION START (POOL) ===');
    console.log('Generating and provisioning MSISDNs for DFSPs...');
    console.log(`FSP Pool configuration: ${JSON.stringify(fspList, null, 2)}`);
    console.log(`fspList length: ${fspList.length}`);
    console.log(`msisdnLength: ${msisdnLength}`);
    console.log(`idType: ${idType}`);

    const localPartiesByFsp = {};

    for (let i = 0; i < fspList.length; i++) {
      const fsp = fspList[i];
      console.log(`Processing FSP ${i + 1}/${fspList.length}`);
      const { fspId, outboundUrl, msisdnPrefix, partyCount } = fsp;

      if (!fspId || !outboundUrl || !msisdnPrefix || !partyCount) {
        console.log(`Skipping FSP ${fspId} - missing required config`);
        console.log(`  fspId: ${fspId}, outboundUrl: ${outboundUrl}, msisdnPrefix: ${msisdnPrefix}, partyCount: ${partyCount}`);
        continue;
      }

      console.log(`Generating MSISDNs for FSP ${fspId}: prefix=${msisdnPrefix}, count=${partyCount}`);
      // Generate unique MSISDNs for this DFSP
      const msisdns = generateMsisdnSet(msisdnPrefix, partyCount, msisdnLength);
      console.log(`Generated ${msisdns.length} MSISDNs for ${fspId}`);
      localPartiesByFsp[fspId] = msisdns;

      // Register all MSISDNs as parties in a single batch request
      const accounts = msisdns.map(msisdn => ({ idType, idValue: msisdn }));
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
      const startupBody = JSON.stringify(accounts);
      const startupResponse = http.post(`${outboundUrl}/accounts`, startupBody, startupParams);
      if (startupResponse.status >= 200 && startupResponse.status < 300) {
        console.log(`Account provisioning successful for FSP ${fspId} - ${accounts.length} accounts registered`);
      } else {
        console.log(`Account provisioning failed for FSP ${fspId} with status: ${startupResponse.status}`);
      }
    }
    console.log('Completed account provisioning');
    console.log(`Provisioned parties for FSPs: ${Object.keys(localPartiesByFsp).join(', ')}`);
    console.log(`Total FSPs in localPartiesByFsp: ${Object.keys(localPartiesByFsp).length}`);
    console.log(`localPartiesByFsp structure: ${JSON.stringify(Object.keys(localPartiesByFsp).reduce((acc, key) => { acc[key] = localPartiesByFsp[key].length; return acc; }, {}))}`);
    const result = { partiesByFsp: localPartiesByFsp };
    console.log(`Returning from setup with keys: ${Object.keys(result).join(', ')}`);
    console.log(`=== SETUP FUNCTION END ===`);
    return result;
  } catch (error) {
    console.error(`!!! SETUP FUNCTION ERROR: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    throw error;
  }
}

export function sdkFxSendE2EPool(testContext) {
  // testContext.partiesByFsp comes from setup()
  if (!testContext || !testContext.partiesByFsp) {
    console.error(`Test context is missing or invalid. testContext: ${JSON.stringify(testContext)}`);
    throw new Error('Missing partiesByFsp in test context.');
  }
  const partiesByFspLocal = testContext.partiesByFsp;
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && console.log(`Available FSPs in context: ${Object.keys(partiesByFspLocal).join(', ')}`);
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
      console.error(`Available FSPs: ${Object.keys(partiesByFspLocal).join(', ')}`);
      console.error(`Requested payer FSP: ${payerFspId}, found: ${!!payerMsisdns}`);
      console.error(`Requested payee FSP: ${payeeFspId}, found: ${!!payeeMsisdns}`);
      console.error(`FSP List from config: ${JSON.stringify(fspList.map(f => f.fspId))}`);
      throw new Error(`Missing MSISDNs for payer or payee DFSP: ${payerFspId}, ${payeeFspId}`);
    }
    // Decide if this transfer should use interscheme discovery or precached lookup
    let useInterschemeDiscovery = Math.random() < interschemeDiscoveryRate;
    let payeePartyId;
    if (useInterschemeDiscovery) {
      // Pick a payee MSISDN that has never been used as a payee before (for interscheme discovery)
      const excludeSet = new Set([...payerMsisdns, ...usedPayees]);
      payeePartyId = getRandomItemExcluding(payeeMsisdns, excludeSet);
      if (payeePartyId) {
        usedPayees.add(payeePartyId); // Mark this MSISDN as used
        console.log(`Using new payee for interscheme discovery: ${payeePartyId} (DFSP: ${payeeFspId})`);
      } else {
        throw new Error(`No unused payee MSISDNs available for interscheme discovery for DFSP: ${payeeFspId}`);
      }
    } else {
      // If false use a payee that has been used before (for precached lookup)
      const usedPayeesForThisFsp = [...usedPayees].filter(msisdn => payeeMsisdns.includes(msisdn));
      if (usedPayeesForThisFsp.length > 0) {
        payeePartyId = usedPayeesForThisFsp[Math.floor(Math.random() * usedPayeesForThisFsp.length)];
      } else {
        payeePartyId = getRandomItemExcluding(payeeMsisdns, new Set());
      }
    }
    // Pick a random payer party
    const payerPartyId = getRandomItemExcluding(payerMsisdns, new Set());
    const amount = payerFsp['amount'] || '2';
    const currency = payerFsp['currency'] || 'XXX';
    const paramTags = { payerFspId, payeeFspId, useInterschemeDiscovery };
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

    // Check if response is valid before parsing
    if (postTransferResponse.status != 200 || !postTransferResponse.body) {
      console.error(`POST /transfers failed with status ${postTransferResponse.status}, body: ${postTransferResponse.body}`);
      if (abortOnError) {
        exec.test.abort();
      }
      return; // Skip the rest of the transfer flow
    }

    const transferId = JSON.parse(postTransferResponse.body).transferId
    if (__ENV.K6_DEBUG_TRANSFER_ID === 'true') {
      console.log(`Transfer ID: ${transferId}`);
    }

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

  });
}
