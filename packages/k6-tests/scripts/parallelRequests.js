import http from 'k6/http';
import { check, group } from 'k6';
import { Trace } from "../common/trace.js";
import { getTwoItemsFromArray } from "../common/utils.js";
import exec from 'k6/execution';


// K6_SCRIPT_FSPIOP_ALS_PAYEE_PARTYID=${__ENV.K6_SCRIPT_FSPIOP_ALS_PAYEE_PARTYID},
// K6_SCRIPT_FSPIOP_PAYER_FSP_ID=${__ENV.K6_SCRIPT_FSPIOP_PAYER_FSP_ID},
// K6_SCRIPT_FSPIOP_PAYEE_FSP_ID=${__ENV.K6_SCRIPT_FSPIOP_PAYEE_FSP_ID},
// K6_SCRIPT_CALLBACK_HANDLER_SERVICE_WS_URL=${__ENV.K6_SCRIPT_CALLBACK_HANDLER_SERVICE_WS_URL},

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS}`);
  console.log(`  K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_ADMIN_ENDPOINT_URL=${__ENV.K6_SCRIPT_ADMIN_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_ORACLE_ENDPOINT_URL=${__ENV.K6_SCRIPT_ORACLE_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL || '[]');
const amount = __ENV.K6_SCRIPT_FSPIOP_QUOTES_AMOUNT?.toString() || '2';
const currency = __ENV.K6_SCRIPT_FSPIOP_QUOTES_CURRENCY
const ilpPacket = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ILPPACKET
const condition = __ENV.K6_SCRIPT_FSPIOP_TRANSFERS_CONDITION

export function parallelRequests() {
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
  group("parallelRequests", function () {
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
    const payeeId = payeeFsp['partyId'];
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];

    const partiesStartTs = Date.now();
    const partiesTraceParent = Trace();
    const partiesParams = {
      tags: {
        payerFspId,
        payeeFspId
      },
      headers: {
        'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
        'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
        'FSPIOP-Source': payerFspId,
        'Date': (new Date()).toUTCString(),
        'traceparent': partiesTraceParent.toString(),
        'tracestate': `tx_end2end_start_ts=${partiesStartTs}`
      },
    };

    const quotesStartTs = Date.now();
    const quotesTraceParent = Trace();
    const quoteId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();

    const quotesParams = {
      tags: {
        payerFspId,
        payeeFspId
      },
      headers: {
        'accept': 'application/vnd.interoperability.quotes+json;version=1.0',
        'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
        'FSPIOP-Source': payerFspId,
        'FSPIOP-Destination': payeeFspId,
        'Date': (new Date()).toUTCString(),
        'traceparent': quotesTraceParent.toString(),
        'tracestate': `tx_end2end_start_ts=${quotesStartTs}`
      },
    };

    const quotesBody = {
      "quoteId": quoteId,
      "transactionId": transactionId,
      "payer": {
        "partyIdInfo": {
          "partyIdType": "ACCOUNT_ID",
          "partyIdentifier": `${payerFsp['partyId']}`,
          "fspId": payerFspId,
          "extensionList": {
            "extension": [
              {
                "key": "test1",
                "value": "test1"
              },
              {
                "key": "test2",
                "value": "test2"
              }
            ]
          }
        },
        "personalInfo": {
          "complexName": {
            "firstName": "Alice",
            "middleName": "A",
            "lastName": "Alison"
          },
          "dateOfBirth": "1970-01-01"
        }
      },
      "payee": {
        "partyIdInfo": {
          "partyIdType": "ACCOUNT_ID",
          "partyIdentifier": `${payeeFsp['partyId']}`,
          "fspId": payeeFspId,
          "extensionList": {
            "extension": [
              {
                "key": "test3",
                "value": "test3"
              },
              {
                "key": "test4",
                "value": "test4"
              }
            ]
          }
        },
        "personalInfo": {
          "complexName": {
            "firstName": "Bob",
            "middleName": "B",
            "lastName": "Bloggs"
          },
          "dateOfBirth": "1970-01-01"
        }
      },
      "amountType": "SEND",
      "amount": {
        "amount": `${amount}`,
        "currency": `${currency}`
      },
      "transactionType": {
        "scenario": "TRANSFER",
        "initiator": "PAYER",
        "initiatorType": "CONSUMER"
      },
      "extensionList": {
        "extension": [
          {
            "key": "quoteExtension1",
            "value": "quoteExtension1"
          },
          {
            "key": "quoteExtension2",
            "value": "quoteExtension2"
          }
        ]
      }
    }


    const transfersStartTs = Date.now();
    const transferId = crypto.randomUUID();
    const transfersTraceParent = Trace();
    const transfersParams = {
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
        'traceparent': transfersTraceParent.toString(),
        'tracestate': `tx_end2end_start_ts=${transfersStartTs}`
      },
    };

    const transfersBody = {
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

    const res = http.batch([
      ['GET', `${__ENV.K6_SCRIPT_FSPIOP_ALS_ENDPOINT_URL}/parties/ACCOUNT_ID/${payeeId}`, null, partiesParams],
      ['POST', `${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}/quotes`, JSON.stringify(quotesBody), quotesParams],
      ['POST', `${__ENV.K6_SCRIPT_FSPIOP_TRANSFERS_ENDPOINT_URL}/transfers`, JSON.stringify(transfersBody), transfersParams]
    ])
    check(res[0], { 'ALS_FSPIOP_GET_PARTIES_RESPONSE_IS_202' : (r) => r.status == 202 });
    check(res[1], { 'QUOTES_FSPIOP_POST_QUOTES_RESPONSE_IS_202' : (r) => r.status == 202 });
    check(res[2], { 'TRANSFERS_FSPIOP_POST_TRANSFERS_RESPONSE_IS_202' : (r) => r.status == 202 });
  });
}
