const axios = require('axios')
const http = require('http')
const express = require('express')
const Utils = require('@callback-handler-svc/utils')
const env = require('env-var')

const TRACESTATE_KEY_END2END_START_TS = 'tx_end2end_start_ts'
const TRACESTATE_KEY_CALLBACK_START_TS = 'tx_callback_start_ts'

const init = (config, logger, options = undefined) => {
  const ALS_ENDPOINT_URL = env.get('FSPIOP_ALS_ENDPOINT_URL').default('http://account-lookup-service:4002').asString()
  const FSP_ID = env.get('FSPIOP_FSP_ID').default('perffsp2').asString()
  const HTTP_KEEPALIVE = env.get('FSPIOP_CALLBACK_HTTP_KEEPALIVE').default('true').asBool()
  const router = express.Router()

  // Handle Payee GET Party
  router.get('/parties/:type/:id', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    // Async callback
    const type = req.params.type
    const id = req.params.id
    const fspiopSourceHeader = req.headers['fspiop-source']
    const traceparentHeader = req.headers['traceparent']
    const tracestateHeader = req.headers['tracestate'];

    (async () => {
      const egressHistTimerEnd = options.metrics.getHistogram(
        'egress_callbackHandler',
        'Egress - Operation handler',
        ['success', 'operation']
      ).startTimer()
      await axios.put(`${ALS_ENDPOINT_URL}/parties/${type}/${id}`, {
        "party": {
          "partyIdInfo": {
            "partyIdType": "MSISDN",
            "partyIdentifier": "19012345002",
            "fspId": FSP_ID,
            "partySubIdOrType": "HEALTH_CARD"
          },
          "personalInfo": {
            "dateOfBirth": "1971-12-25",
            "complexName": {
              "lastName": "Trudeau",
              "middleName": "Pierre",
              "firstName": "Justin"
            }
          },
          "name": "Justin Pierre"
        }
      },
      {
        headers: {
          'Content-Type': 'application/vnd.interoperability.parties+json;version=1.1',
          'Accept': 'application/vnd.interoperability.parties+json;version=1.1',
          Date: new Date(),
          'FSPIOP-Source': FSP_ID,
          'FSPIOP-Destination': fspiopSourceHeader,
          'traceparent': traceparentHeader,
          'tracestate': tracestateHeader + `,${TRACESTATE_KEY_CALLBACK_START_TS}=${Date.now()}`
        },
        httpAgent: new http.Agent({ keepAlive: HTTP_KEEPALIVE }),
      })
      egressHistTimerEnd({ success: true, operation: 'fspiop_put_parties'})
    })();
    // Sync 202
    res.status(202)
    res.end()
    histTimerEnd({ success: true, operation: 'fspiop_get_parties'})
  })

  // Handle Payee GET Participants
  router.get('/participants', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    // Async callback
    const type = req.params.type
    const id = req.params.id
    const fspiopSourceHeader = req.headers['fspiop-source']
    const traceparentHeader = req.headers['traceparent']
    const tracestateHeader = req.headers['tracestate'];

    (async () => {
      const egressHistTimerEnd = options.metrics.getHistogram(
        'egress_callbackHandler',
        'Egress - Operation handler',
        ['success', 'operation']
      ).startTimer()
      await axios.put(`${ALS_ENDPOINT_URL}/participants/${type}/${id}`, {
        "fspId": ""
      },
      {
        headers: {
          'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
          Date: new Date(),
          'FSPIOP-Source': FSP_ID,
          'FSPIOP-Destination': fspiopSourceHeader,
          'traceparent': traceparentHeader,
          'tracestate': tracestateHeader + `,${TRACESTATE_KEY_CALLBACK_START_TS}=${Date.now()}`
        },
        httpAgent: new http.Agent({ keepAlive: HTTP_KEEPALIVE }),
      })
      egressHistTimerEnd({ success: true, operation: 'fspiop_put_participants'})
    })();
    // Sync 202
    res.status(202)
    res.end()

    histTimerEnd({ success: true, operation: 'fspiop_get_participants'})
  })

  const handleCallback = (resource, req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    const currentTime = Date.now()
    const path = req.path
    const httpMethod = req.method.toLowerCase()
    const isErrorOperation = path.endsWith('error')
    const operation = `fspiop_${httpMethod}_${resource}`
    const operationE2e = `${operation}_end2end`
    const operationRequest = `${operation}_request`
    const operationResponse = `${operation}_response`
    const tracestate = Utils.TraceUtils.getTraceStateMap(req.headers)

    if (tracestate === undefined || tracestate[TRACESTATE_KEY_END2END_START_TS] === undefined || tracestate[TRACESTATE_KEY_CALLBACK_START_TS] === undefined) {
      return res.status(400).send(`${TRACESTATE_KEY_END2END_START_TS} or ${TRACESTATE_KEY_CALLBACK_START_TS} key/values not found in tracestate`)
    }

    const e2eDelta = currentTime - tracestate[TRACESTATE_KEY_END2END_START_TS]
    const requestDelta = tracestate[TRACESTATE_KEY_CALLBACK_START_TS] - tracestate[TRACESTATE_KEY_END2END_START_TS]
    const responseDelta = currentTime - tracestate[TRACESTATE_KEY_CALLBACK_START_TS]

    const performanceHistogram = options.metrics.getHistogram(
      'tx_cb_perf',
      'Metrics for callbacks',
      ['success', 'path', 'operation']
    )

    performanceHistogram.observe({
      success: (!isErrorOperation).toString(),
      path,
      operation: operationE2e
    }, e2eDelta / 1000)
    performanceHistogram.observe({
      success: (!isErrorOperation).toString(),
      path,
      operation: operationRequest
    }, requestDelta / 1000)
    performanceHistogram.observe({
      success: (!isErrorOperation).toString(),
      path,
      operation: operationResponse
    }, responseDelta / 1000)

    logger.isDebugEnabled && logger.debug(
      {
        traceparent: req.headers.traceparent,
        tracestate,
        operation,
        path,
        isErrorOperation,
        serverHandlingTime: currentTime,
        [operationE2e]: e2eDelta,
        [operationRequest]: requestDelta,
        [operationResponse]: responseDelta
      }
    )
    const traceId = Utils.TraceUtils.getTraceId(req.headers)
    const channel = '/' + traceId + '/' + req.method + req.path
    options.wsServer.notify(channel, isErrorOperation ? 'ERROR_CALLBACK_RECEIVED' : 'SUCCESS_CALLBACK_RECEIVED')
    histTimerEnd({ success: true, operation })
    res.status(202)
    return res.end()
  }

  // Handle Payer PUT Party callback
  router.put('/parties/*', (req, res) => {
    return handleCallback('parties', req, res)
  })

  // Handle Payer PUT Participants callback
  router.put('/participants/*', (req, res) => {
    return handleCallback('participants', req, res)
  })

  return {
    name: 'fspiop',
    basepath: '/fspiop',
    router
  }
}

// require-glob has no ES support
module.exports = {
  init
}
