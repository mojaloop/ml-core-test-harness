const axios = require('axios')
const express = require('express')
const Metrics = require('@mojaloop/central-services-metrics')

const getTraceStateMap = (headers) => {
  const tracestate = headers.tracestate
  if (tracestate === undefined) {
    return {
      tx_end2end_start_ts: undefined,
      tx_callback_start_ts: undefined
    }
  }
  let tracestates = {}
  tracestate
    .split(',')
    .map(item => item.split('='))
    .map(([k, v]) => {
      return k.startsWith('tx_') ? { [k]: Number(v) } : { [k]: v }
    })
    .forEach(ts => {
    tracestates = { ...tracestates, ...ts }
    })
  return tracestates
}

const getTraceId = (headers) => {
  const traceparent = headers.traceparent
  if (traceparent === undefined) {
    return null
  }
  return traceparent.split('-')[1];
}


const init = (depConfig, userConfig, logger, options = undefined) => {
  // TODO: Need to parameterize the following endpoints
  const ALS_ENDPOINT_URL = userConfig.CALLBACK_ENDPOINTS.ALS_ENDPOINT_URL
  const FSP_ID = 'perffsp2'
  const router = express.Router()

  // Handle Payee GET Party
  router.get('/parties/:type/:id', (req, res) => {
    const histTimerEnd = depConfig.metrics.getHistogram(
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
      axios.put(`${ALS_ENDPOINT_URL}/parties/${type}/${id}`, {
        "party": {
          "partyIdInfo": {
            "partyIdType": "MSISDN",
            "partyIdentifier": "19012345002",
            "fspId": FSP_ID,
            "extensionList": {
              "extension": [
                {
                  "key": "labore",
                  "value": "occaecat exercitation dolor laborum"
                },
                {
                  "key": "deser",
                  "value": "quis dese"
                }
              ]
            },
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
          'FSPIOP-Source': 'perffsp2',
          'FSPIOP-Destination': fspiopSourceHeader,
          'traceparent': traceparentHeader,
          'tracestate': tracestateHeader + ',tx_callback_start_ts=' + Date.now()
        }
      })
    })();
    // Sync 202
    res.status(202)
    res.end()
    histTimerEnd({ success: true, operation: 'fspiop_get_parties'})
  })

  // Handle Payee GET Participants
  router.get('/participants', (req, res) => {
    const histTimerEnd = depConfig.metrics.getHistogram(
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
      axios.put(`${ALS_ENDPOINT_URL}/participants/${type}/${id}`, {
        "fspId": ""
      },
      {
        headers: {
          'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
          Date: new Date(),
          'FSPIOP-Source': FSP_ID,
          'FSPIOP-Destination': fspiopSourceHeader,
          'traceparent': traceparentHeader,
          'tracestate': tracestateHeader + ',tx_callback_start_ts=' + Date.now()
        }
      })
    })();
    // Sync 202
    res.status(202)
    res.end()

    histTimerEnd({ success: true, operation: 'fspiop_get_participants'})
  })

  const handleCallback = (resource, req, res) => {
    const histTimerEnd = depConfig.metrics.getHistogram(
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
    const tracestate = getTraceStateMap(req.headers)

    if (tracestate?.tx_end2end_start_ts === undefined || tracestate?.tx_callback_start_ts === undefined) {
      return res.status(400).send('tx_end2end_start_ts or tx_callback_start_ts key/values not found in tracestate')
    }

    const e2eDelta = currentTime - tracestate.tx_end2end_start_ts
    const requestDelta = tracestate.tx_callback_start_ts - tracestate.tx_end2end_start_ts
    const responseDelta = currentTime - tracestate.tx_callback_start_ts

    const performanceHistogram = depConfig.metrics.getHistogram(
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
    const traceId = getTraceId(req.headers)
    const channel = '/' + traceId + '/' + req.method + req.path
    depConfig.wsServer.notify(channel, isErrorOperation ? 'ERROR_CALLBACK_RECEIVED' : 'SUCCESS_CALLBACK_RECEIVED')
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
