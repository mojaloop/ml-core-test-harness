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

## Mixed regional soak scenario (DRPP + GISP)

Use `sdkSendE2EMixedUsecase` to run a realistic soak profile with:

- DRPP cross-border P2P and P2M (FX path with `acceptConversion`)
- GISP P2P single-currency (in-scheme path)
- Variable payload size using the `note` field
- Metadata-rich payloads using `quoteRequestExtensions` and `transferRequestExtensions`
- Toggleable unhappy-path injections

### `from.displayName` trigger strings

The script uses `from.displayName` to trigger simulator behavior. Default values:

- Happy path: `TRIG_HAPPY`
- Timeout: `TRIG_TIMEOUT`
- Payee abort: `TRIG_PAYEE_ABORT`
- FXP abort: `TRIG_FXP_ABORT`
- Quote rule rejection: `TRIG_QUOTE_RULE`
- Liquidity/NDC rejection: `TRIG_LIQUIDITY_NDC`
- Invalid lookup/number: `TRIG_INVALID_NUMBER`

You can override any trigger string via environment variables:

- `K6_SCRIPT_TRIGGER_HAPPY`
- `K6_SCRIPT_TRIGGER_TIMEOUT`
- `K6_SCRIPT_TRIGGER_PAYEE_ABORT`
- `K6_SCRIPT_TRIGGER_FXP_ABORT`
- `K6_SCRIPT_TRIGGER_QUOTE_RULE`
- `K6_SCRIPT_TRIGGER_LIQUIDITY_NDC`
- `K6_SCRIPT_TRIGGER_INVALID_NUMBER`

### Enable/disable unhappy paths

Each unhappy path can be independently enabled or disabled:

- `K6_SCRIPT_UNHAPPY_TIMEOUT_ENABLED`
- `K6_SCRIPT_UNHAPPY_PAYEE_ABORT_ENABLED`
- `K6_SCRIPT_UNHAPPY_FXP_ABORT_ENABLED`
- `K6_SCRIPT_UNHAPPY_QUOTE_RULE_ENABLED`
- `K6_SCRIPT_UNHAPPY_LIQUIDITY_NDC_ENABLED`
- `K6_SCRIPT_UNHAPPY_INVALID_NUMBER_ENABLED`

Control overall unhappy injection rate with `K6_SCRIPT_UNHAPPY_RATE`.

### Variable-rate execution

Run with variable rate using the included config:

- local: `K6_SCRIPT_CONFIG_FILE_NAME=sdkSendE2EMixedUsecase.json k6 run index.js`
- k8s profile folder: `K6_SCRIPT_CONFIG_FOLDER_NAME=config-k8s K6_SCRIPT_CONFIG_FILE_NAME=sdkSendE2EMixedUsecase.json k6 run index.js`

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
