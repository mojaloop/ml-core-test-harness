/**
 The script is divided into three main parts: 
 
 Define the counter and error rate metrics. 
 Define the options for the test. 
 Define the functions to get the token and make the request to the quotes endpoint. 
 
 The  getAuthToken  function makes a request to the Keycloak token endpoint to get a token. 
 The  getQuotes  function makes a request to the quotes endpoint using the token. The main function runs the test by calling these two functions and checking the response status. 
 Run the script using the following command: 
 
  $  k6 run quotes-test.js
 
*/

import http from 'k6/http';
import { check } from 'k6';
// import { Counter } from 'k6/metrics';
// import { Rate } from 'k6/metrics';

// // Metrics
// const successCounter = new Counter('successful_requests');
// const errorRate = new Rate('error_rate');

// mTLS certs
const cert = open(`${__ENV.CERTS_DIR}/private.crt`)
const key  = open(`${__ENV.CERTS_DIR}/public.key`)

// NOTE: For some reason, this options are not picked up in the test harnes docker compose run
export const options = {  
  // k6 does not support custom CA certificates, so we need to skip TLS verification
  insecureSkipTlsVerify: true, 
  tlsAuth: [{ cert, key}],
};

export function getAuthToken() {
  const url = 'https://keycloak.awsdev.labsk8s1014.mojaloop.live/realms/dfsps/protocol/openid-connect/token';
  const payload = {
    grant_type: 'client_credentials',
    client_id: __ENV.CLIENT_ID,
    client_secret: __ENV.CLIENT_SECRET,
  };
  const params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  const res = http.post(url, payload, params);
  return res.json().access_token;
}

export function getQuotes(token) {
    const url = 'https://extapi.awsdev.labsk8s1014.mojaloop.live/quotes';
    const payload = JSON.stringify({"quoteId":"97f74c89-6d42-490f-82ab-07a8500c29a7","transactionId":"c7ca1e55-8aee-4993-9585-94fbfec986c0","payer":{"partyIdInfo":{"partyIdType":"MSISDN","partyIdentifier":"111111111","fspId":"awsdevpm1"},"personalInfo":{"complexName":{"firstName":"Mats","lastName":"Hagman"},"dateOfBirth":"1983-10-25"}},"payee":{"partyIdInfo":{"partyIdType":"MSISDN","partyIdentifier":"2222222","fspId":"pm4mltest4"}},"amountType":"SEND","amount":{"amount":"10","currency":"USD"},"transactionType":{"scenario":"TRANSFER","initiator":"PAYER","initiatorType":"CONSUMER"},"note":"hej"});
    const params = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.interoperability.quotes+json;version=1.0',
            'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
            'FSPIOP-Source': 'awsdevpm1',
            'FSPIOP-Destination': 'pm4mltest4',
            'FSPIOP-HTTP-Method': 'POST',
            'FSPIOP-URI': '/quotes',
            'Date': 'Fri, 17 May 2024 11:35:20 GMT'
        },
    };
    return http.post(url, payload, params);
}

export function testIstioOry() {
  const token = getAuthToken();
  const res = getQuotes(token);
  const success = check(res, {
    'status is 202': (r) => r.status === 202,
  });
  // successCounter.add(success);
  // errorRate.add(!success);
}
