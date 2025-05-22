import { check, fail } from "k6";
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export function checkStatus({ response, expectedStatus, expectedContent, failOnError, printOnError, dynamicIds }) {
  if (isEmpty(expectedStatus) && isEmpty(expectedContent)) {
    console.warn('No expected status or content specified in call to checkStatus for URL ' + response.url);
    return;
  }

  let contentCheckResult;
  let statusCheckResult;

  let url = response.url;

  if (dynamicIds) {
    dynamicIds.forEach((dynamicId) => {
      if (response.url.includes(dynamicId)) {
        url = url.replace(dynamicId, '[id]');
      }
    });
  }

  if (expectedContent) {
    contentCheckResult = check(response, {
      [`"${expectedContent}" in ${url} response`]: (r) => r.body.includes(expectedContent),
    });
  }

  if (expectedStatus) {
    const obj = {};
    obj[`${response.request.method} ${url} status ${expectedStatus}`] = (r) => r.status === expectedStatus;

    statusCheckResult = check(response, obj);
  }
  
  if (!statusCheckResult || !contentCheckResult && expectedContent) {
    if (printOnError && response.body) {
      console.log("Unexpected response: " + response.body);
    }
    if (failOnError) {
      if (!statusCheckResult && (!contentCheckResult && expectedContent)) {
        fail(`${response.request.method} ${url} status ${expectedStatus} and "${expectedContent}" not found in response`);
      } else {
        if (!statusCheckResult) {
          fail(`Received unexpected status code ${response.status} for URL: ${url}, expected ${expectedStatus}`);
        } else if (!contentCheckResult) {
          fail(`"${expectedContent}" not found in response for URL: ${url}`);
        }
      }
    }
  }
}

function isEmpty(str) {
  return (!str || str.length === 0);
}

export function getTwoItemsFromArray(inputArray) {
  
  // Option 1
  // const outputArray = inputArray.concat().sort(() => randomItem([-1,1])).slice(0, 2);
  
  // Option 2
  const tempArray = [ ...inputArray ]
  const outputArray = []
  const selectedItem1 = randomItem(tempArray)
  outputArray.push(selectedItem1)
  tempArray.splice(tempArray.indexOf(selectedItem1), 1);
  outputArray.push(randomItem(tempArray))

  return outputArray
}

export function getRandomItemFromArray(inputArray) {
  return randomItem(inputArray)
}
