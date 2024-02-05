import http from 'k6/http';
import { crypto } from "k6/experimental/webcrypto";
import { check, group } from 'k6';
import { getTwoItemsFromArray } from "../common/utils.js";

console.log(`Env Vars -->
  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL},
  K6_SCRIPT_SDK_ENDPOINT_URL=${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL},
`);

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)
const amount = __ENV.K6_SCRIPT_FSPIOP_QUOTES_AMOUNT.toString()
const currency = __ENV.K6_SCRIPT_FSPIOP_QUOTES_CURRENCY

export function postQuotes() {
  group("Post Quotes", function () {
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

    const quoteId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const payerFspId = payerFsp['fspId'];
    const payeeFspId = payeeFsp['fspId'];

    const params = {
      tags: {
        payerFspId,
        payeeFspId
      },
      headers: {
        // 'accept': 'application/vnd.interoperability.quotes+json;version=1.0',
        'Content-Type': 'application/json',
        'FSPIOP-Source': payerFspId,
        'FSPIOP-Destination': payeeFspId,
        'Date': (new Date()).toUTCString()
      },
    };

    const body = {
      "fspId": payerFspId,
      "quotesPostRequest": {
        "quoteId": quoteId,
        "transactionId": transactionId,
        "payee": {
          "partyIdInfo": {
            "partyIdType": "MSISDN",
            "partyIdentifier": `${payeeFsp['partyId']}`,
            "fspId": payeeFspId
          }
        },
        "payer": {
          "partyIdInfo": {
            "partyIdType": "MSISDN",
            "partyIdentifier": `${payerFsp['partyId']}`,
            "fspId": payerFspId
          }
        },
        "amountType": "SEND",
        "amount": {
          "amount": `${amount}`,
          "currency": `${currency}`
        },
        "transactionType": {
          "scenario": "DEPOSIT",
          "initiator": "PAYER",
          "initiatorType": "AGENT",
        }
      }
    }

    // Lets send the FSPIOP POST /quotes request
    const res = http.post(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/quotes`, JSON.stringify(body), params);
    check(res, { 'QUOTES_FSPIOP_POST_QUOTES_RESPONSE_IS_200' : (r) => r.status == 200 });
  });
}
