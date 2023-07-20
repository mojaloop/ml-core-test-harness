
const init = (express, metrics, logger, date, wsServer, axios, options = undefined) => {

  const FSP_ID = 'perffsp2'
  const router = express.Router()

  // Handle Payee GET Party
  router.get('/parties/:type/:id', (req, res) => {
    // Sync 202
    res.status(202)
    res.end()

    // Async callback
    const type = req.params.type
    const id = req.params.id
    const host = req.get('host')
    // Send to TTK to double check callback http://10.1.2.182:9440 or http://localhost:4040
    axios.put(`${host}/parties/${type}/${id}`, {
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
        Date: new date(),
        'FSPIOP-Source': 'perffsp2',
        'FSPIOP-Destination': req.headers['FSPIOP-Source'],
        'traceparent': req.headers['traceparent'],
        'tracestate': req.headers['tracestate'] + ',tx_callback_start_ts=' + date.now()
      }
    })
  })

  // Handle Payee GET Participants
  router.get('/participants', (req, res) => {
    // Sync 202
    res.status(202)
    res.end()

    // Async callback
    const type = req.params.type
    const id = req.params.id
    const host = req.get('host')
    axios.put(`${host}/participants/${type}/${id}`, {
      "fspId": ""
    },
    {
      headers: {
        'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
        Date: new date(),
        'FSPIOP-Source': FSP_ID,
        'FSPIOP-Destination': req.headers['FSPIOP-Source'],
        'traceparent': req.headers['traceparent'],
        'tracestate': req.headers['tracestate'] + ',tx_callback_start_ts=' + date.now()
      }
    })
  })


  const handleCallback = (resource, req, res) => {
    const histTimerEnd = metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Wildcard operation handler',
      ['success', 'operation']
    ).startTimer()
    const currentTime = date.now()
    const path = req.path
    const httpMethod = req.method.toLowerCase()
    const isErrorOperation = path.endsWith('error')
    const operation = `${httpMethod}_${resource}`
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

    const performanceHistogram = metrics.getHistogram(
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
    // TODO: Refine this
    const channel = '/' + traceId + '/' + req.method + req.path
    wsServer.notify(channel,'CALLBACK_RECEIVED')
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
