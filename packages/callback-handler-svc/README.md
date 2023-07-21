# Callback Handler Service

## Environment Variables used by handlers

| ENV variable name | Type | Description | Handler | Default |
| -------- | ------- | -------- | ------- | ------- |
| FSPIOP_ALS_ENDPOINT_URL | string | Endpoint URL for ALS callback | fspiop | http://account-lookup-service:4002 |
| FSPIOP_FSP_ID | string | FSP_ID to be used in fspiop-source headers and in ALS callback | fspiop | perffsp2 |
| FSPIOP_CALLBACK_HTTP_KEEPALIVE | boolean | HTTP keepalive for callbacks | fspiop | true |
