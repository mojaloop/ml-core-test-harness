import http from 'k6/http';
// import { crypto } from "k6/experimental/webcrypto";
import { check, group } from 'k6';
import { Trace } from "../common/trace.js";
import { getTwoItemsFromArray } from "../common/utils.js";
import { uuid } from '../common/uuid.js'
import exec from 'k6/execution';

function log() {
  console.log('Env Vars -->');
  console.log(`  K6_SCRIPT_WS_TIMEOUT_MS=${__ENV.K6_SCRIPT_WS_TIMEOUT_MS}`);
  console.log(`  K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL=${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}`);
  console.log(`  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL}`);
}

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)
const amount = __ENV.K6_SCRIPT_FSPIOP_QUOTES_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_QUOTES_CURRENCY

export function postQuotesNoCallback() {
  !exec.instance.iterationsCompleted && (exec.vu.idInTest === 1) && log();
  group("postQuotesNoCallback", function () {
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
    // const quoteId = crypto.randomUUID();
    // const transactionId = crypto.randomUUID();
    const quoteId = uuid();
    const transactionId = uuid();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];
    const traceParent = Trace();

    const params = {
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
        'traceparent': traceParent.toString(),
        'tracestate': `tx_end2end_start_ts=${startTs}`
      },
    };

    const body = {
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


    // Lets send the FSPIOP POST /quotes request
    const res = http.post(`${__ENV.K6_SCRIPT_FSPIOP_QUOTES_ENDPOINT_URL}/quotes`, JSON.stringify(body), params);
    check(res, { 'QUOTES_FSPIOP_POST_QUOTES_RESPONSE_IS_202' : (r) => r.status == 202 });
  });
}
