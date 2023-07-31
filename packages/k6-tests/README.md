# k6 Test Scripts

## Introduction

This project is based on the [k6-example-woocommerce](https://github.com/grafana/k6-example-woocommerce/tree/v2) example.

The template is structured so that:

- Scripts performing HTTP requests and response validation are located in the `scripts` folder
- Scripts denoting the order in which the above should be executed (in other words, "User Journeys") are stored in the `scenarios` folder
- Utility scripts containing generic functions are stored in the `common` folder
- [Options](https://k6.io/docs/using-k6/options/) are loaded from a JSON file

As a result of the above, the entry-point script (executed using the `k6 run index.js` command) only concerns itself with:

- Setting up global variables (typically constants) that as a result become available throughout the rest of the codebase
- Exporting the `options` object loaded from the JSON config file, along with using `Object.assign` to merge it with options provided in the script (best of both worlds)
- Providing the `export` statements needed to run the exported functions in `scenarios` (see the [exec](https://k6.io/docs/using-k6/scenarios/#common-options) property)

## Usage

Please note that the server hosting the site is not scaled for heavy load; the scripts are being provided as working examples. Only run them if you want to see what kind of feedback k6 provides when they are run as part of a test.

1. Install [k6](https://k6.io) (instructions [here](https://k6.io/docs/getting-started/installation/))
2. Clone the repo
3. Navigate to the directory and `k6 run index.js` (make sure k6 is on your PATH)

## A note on large projects

Projects grow over time. Depending on the scale of the automation effort (and, arguably, how well the system you're testing was written), there can be many distinct combinations of endpoint URLs, potentially spanning multiple domains and/or subdomains. In this situation, it may help to organize scripts into subfolders within the `scripts` folder.

You might consider a folder structure like this:

```
scripts
|
│───api
|   - account.js     // here it might make sense to store exported functions for both '/account' and '/account/me' endpoints
|
│───app
│   - home.js
│   - login.js
```

This pattern works especially well for REST APIs.
