import http from 'k6/http';
import { check, group } from 'k6';
import { getTwoItemsFromArray } from "../common/utils.js";

console.log(`Env Vars -->
  K6_SCRIPT_FSPIOP_FSP_POOL=${__ENV.K6_SCRIPT_FSPIOP_FSP_POOL},
  K6_SCRIPT_SDK_ENDPOINT_URL=${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL},
`);

const fspList = JSON.parse(__ENV.K6_SCRIPT_FSPIOP_FSP_POOL)

export function getParties() {
  group("Get Parties", function () {
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
    
    const params = {
      tags: {
        payerFspId,
        payeeFspId
      },
      headers: {
        'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
        'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
        'FSPIOP-Source': payerFspId,
        'Date': (new Date()).toUTCString(),
      },
    };

    const res = http.get(`${__ENV.K6_SCRIPT_SDK_ENDPOINT_URL}/parties/MSISDN/${payeeId}`, params);
    check(res, { 'SDK_GET_PARTIES_RESPONSE_IS_200' : (r) => r.status == 200 });

  });
}
