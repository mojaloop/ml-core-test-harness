const axios = require('axios')
const http = require('http')
const express = require('express')
const { TraceUtils } = require('@callback-handler-svc/utils')
const env = require('env-var')

const TRACESTATE_KEY_END2END_START_TS = 'tx_end2end_start_ts'
const TRACESTATE_KEY_CALLBACK_START_TS = 'tx_callback_start_ts'

// ILP Packet: AYIDGQAAAAAAACcQIWcuZ3JlZW5iYW5rZnNwLm1zaXNkbi4yNzcxMzgwMzkxMoIC62V5SjBjbUZ1YzJGamRHbHZia2xrSWpvaU1ERXhaR1EyTldZdE5UQXpNeTAwTVdNMkxUazFaR1l0T1RFeFl6WTRPVFExWWpobUlpd2ljWFZ2ZEdWSlpDSTZJbVF3TXpJMU1EVTJMVE0xTldFdE5EUmxNUzFpT1RnMExXWXdZVFExTmpFMFkyRXpPQ0lzSW5CaGVXVmxJanA3SW5CaGNuUjVTV1JKYm1adklqcDdJbkJoY25SNVNXUlVlWEJsSWpvaVRWTkpVMFJPSWl3aWNHRnlkSGxKWkdWdWRHbG1hV1Z5SWpvaU1qYzNNVE00TURNNU1USWlMQ0ptYzNCSlpDSTZJbWR5WldWdVltRnVhMlp6Y0NKOWZTd2ljR0Y1WlhJaU9uc2ljR0Z5ZEhsSlpFbHVabThpT25zaWNHRnlkSGxKWkZSNWNHVWlPaUpOVTBsVFJFNGlMQ0p3WVhKMGVVbGtaVzUwYVdacFpYSWlPaUkwTkRFeU16UTFOamM0T1NJc0ltWnpjRWxrSWpvaWNHbHVhMkpoYm10bWMzQWlmU3dpY0dWeWMyOXVZV3hKYm1adklqcDdJbU52YlhCc1pYaE9ZVzFsSWpwN0ltWnBjbk4wVG1GdFpTSTZJa1pwY25OMGJtRnRaUzFVWlhOMElpd2liR0Z6ZEU1aGJXVWlPaUpNWVhOMGJtRnRaUzFVWlhOMEluMHNJbVJoZEdWUFprSnBjblJvSWpvaU1UazROQzB3TVMwd01TSjlmU3dpWVcxdmRXNTBJanA3SW1OMWNuSmxibU41SWpvaVZWTkVJaXdpWVcxdmRXNTBJam9pTVRBd0luMHNJblJ5WVc1ellXTjBhVzl1Vkhsd1pTSTZleUp6WTJWdVlYSnBieUk2SWxSU1FVNVRSa1ZTSWl3aWFXNXBkR2xoZEc5eUlqb2lVRUZaUlZJaUxDSnBibWwwYVdGMGIzSlVlWEJsSWpvaVEwOU9VMVZOUlZJaWZYMAA
// Condition: 5m0gq_5dLQlTSSRKQmLpj0MZ1MtWLWgSu1oLGVTJyYs
const FULFILMENT = 'lnYe4rYwLthWbzhVyX5cAuDfL1Ulw4WdaTgyGDREysw'
const instance = axios.create()

const init = (config, logger, options = undefined) => {
  const FSPIOP_ALS_ENDPOINT_URL = env.get('CBH_FSPIOP_ALS_ENDPOINT_URL').default('http://account-lookup-service:4002').asString()
  const FSPIOP_TRANSFERS_ENDPOINT_URL = env.get('CBH_FSPIOP_TRANSFERS_ENDPOINT_URL').default('http://ml-api-adapter:3000').asString()
  const FSPIOP_QUOTES_ENDPOINT_URL = env.get('CBH_FSPIOP_QUOTES_ENDPOINT_URL').default('http://quoting-service:3002').asString()
  const FSP_ID = env.get('CBH_FSPIOP_FSP_ID').default('perffsp2').asString()
  const HTTP_KEEPALIVE = env.get('CBH_FSPIOP_CALLBACK_HTTP_KEEPALIVE').default('true').asBool()
  const router = express.Router()
  const ilpPacket = env.get('CBH_FSPIOP_QUOTES_ILPPACKET').asString()
  const condition = env.get('CBH_FSPIOP_QUOTES_CONDITION').asString()
  const quoteExpirationWindow = env.get('CBH_QUOTE_EXPIRATION_WINDOW').asInt()
  const httpAgent = new http.Agent({ keepAlive: HTTP_KEEPALIVE })

  // Handle Payee GET Party
  router.get('/parties/:type/:id', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    const histTimerEnd1 = options.metrics.getHistogram(
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
      try {
        await instance.put(`${FSPIOP_ALS_ENDPOINT_URL}/parties/${type}/${id}`, {
          "party": {
            "partyIdInfo": {
              "type": "CONSUMER",
              "partyIdType": "MSISDN",
              "partyIdentifier": id,
              "fspId": FSP_ID
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
          httpAgent,
        })      
      } catch (e) {
        console.log('failed here: ', `${FSPIOP_ALS_ENDPOINT_URL}/parties/${type}/${id}`)
        logger.error(e)

      }
      egressHistTimerEnd({ success: true, operation: 'fspiop_put_parties'})
      histTimerEnd1({ success: true, operation: 'fspiop_get_parties_with_callback'})
    })();
    // Sync 202
    res.status(202).end()
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
      await instance.put(`${FSPIOP_ALS_ENDPOINT_URL}/participants/${type}/${id}`, {
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
        httpAgent,
      })
      egressHistTimerEnd({ success: true, operation: 'fspiop_put_participants'})
    })();
    // Sync 202
    res.status(202).end()

    histTimerEnd({ success: true, operation: 'fspiop_get_participants'})
  })

  // Handle Payee POST /transfers
  router.post('/transfers', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    // Async callback
    const fspiopSourceHeader = req.headers['fspiop-source']
    const traceparentHeader = req.headers['traceparent']
    const tracestateHeader = req.headers['tracestate'];
    const transferId = req.body.transferId;

    (async () => {
      const egressHistTimerEnd = options.metrics.getHistogram(
        'egress_callbackHandler',
        'Egress - Operation handler',
        ['success', 'operation']
      ).startTimer()
      try {
        await instance.put(`${FSPIOP_TRANSFERS_ENDPOINT_URL}/transfers/${transferId}`, {
            "transferState": "COMMITTED",
            "fulfilment": FULFILMENT,
            "completedTimestamp": (new Date()).toISOString()
        },
        {
          headers: {
            'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.1',
            'Accept': 'application/vnd.interoperability.transfers+json;version=1.1',
            Date: (new Date()).toUTCString(),
            'FSPIOP-Source': FSP_ID,
            'FSPIOP-Destination': fspiopSourceHeader,
            'traceparent': traceparentHeader,
            'tracestate': tracestateHeader + `,${TRACESTATE_KEY_CALLBACK_START_TS}=${Date.now()}`
          },
          httpAgent,
        })
        egressHistTimerEnd({ success: true, operation: 'fspiop_put_transfers'})
      } catch(err) {
        logger.error({
          traceparent: req.headers.traceparent,
          operation: 'fspiop_put_transfers',
          err,
        })
        egressHistTimerEnd({ success: false, operation: 'fspiop_put_transfers'})
      }
    })();
    // Sync 202
    res.status(202).end()
    histTimerEnd({ success: true, operation: 'fspiop_post_transfers'})
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
  const tracestate = TraceUtils.getTraceStateMap(req.headers)

    if (tracestate === undefined || tracestate[TRACESTATE_KEY_END2END_START_TS] === undefined || tracestate[TRACESTATE_KEY_CALLBACK_START_TS] === undefined) {
      return res.status(400).send(`${TRACESTATE_KEY_END2END_START_TS} or ${TRACESTATE_KEY_CALLBACK_START_TS} key/values not found in tracestate`)
    }

    const e2eDelta = currentTime - tracestate[TRACESTATE_KEY_END2END_START_TS]
    const requestDelta = tracestate[TRACESTATE_KEY_CALLBACK_START_TS] - tracestate[TRACESTATE_KEY_END2END_START_TS]
    const responseDelta = currentTime - tracestate[TRACESTATE_KEY_CALLBACK_START_TS]

    const performanceHistogram = options.metrics.getHistogram(
      'tx_cb_perf',
      'Metrics for callbacks',
      ['success', 'operation']
    )

    performanceHistogram.observe({
      success: (!isErrorOperation).toString(),
      operation: operationE2e
    }, e2eDelta / 1000)
    performanceHistogram.observe({
      success: (!isErrorOperation).toString(),
      operation: operationRequest
    }, requestDelta / 1000)
    performanceHistogram.observe({
      success: (!isErrorOperation).toString(),
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
    const traceId = TraceUtils.getTraceId(req.headers)
    const channel = '/' + traceId + '/' + req.method + req.path
    logger.info(channel)
    options.wsServer.notify(channel, isErrorOperation ? 'ERROR_CALLBACK_RECEIVED' : 'SUCCESS_CALLBACK_RECEIVED')
    histTimerEnd({ success: true, operation })
    return res.status(202).end()
  }

  // Handle Payer PUT Party callback
  router.put('/parties/*', (req, res) => {
    return handleCallback('parties', req, res)
  })

  // Handle Payer PUT Participants callback
  router.put('/participants/*', (req, res) => {
    return handleCallback('participants', req, res)
  })

  // Handle Payer PUT Transfers callback
  router.put('/transfers/*', (req, res) => {
    return handleCallback('transfers', req, res)
  })


  // Handle Payee POST /quotes
  router.post('/quotes', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    delete instance.defaults.headers.common.Accept

    // Async callback
    const fspiopSourceHeader = req.headers['fspiop-source']
    const traceparentHeader = req.headers['traceparent']
    const tracestateHeader = req.headers['tracestate'];
    const quoteId = req.body.quoteId;

    (async () => {
      const egressHistTimerEnd = options.metrics.getHistogram(
        'egress_callbackHandler',
        'Egress - Operation handler',
        ['success', 'operation']
      ).startTimer()
      try {
        const quoteBody = req.body
        const quoteTransferAmount = quoteBody.amount.amount
        const quoteExpiration = new Date(new Date().getTime() + quoteExpirationWindow).toISOString()

        // Important to remove the Accept header, otherwise axios will add a default one to the request
        // and the validation will fail
        await instance.put(`${FSPIOP_QUOTES_ENDPOINT_URL}/quotes/${quoteId}`, {
          "transferAmount": {
            "currency": `${quoteBody.amount.currency}`,
            "amount": `${quoteTransferAmount}`
          },
          "ilpPacket": ilpPacket,
          "condition": condition,
          "expiration": quoteExpiration
        },
        {
          headers: {
            'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
            Date: (new Date()).toUTCString(),
            'FSPIOP-Source': FSP_ID,
            'FSPIOP-Destination': fspiopSourceHeader,
            'traceparent': traceparentHeader,
            'tracestate': tracestateHeader + `,${TRACESTATE_KEY_CALLBACK_START_TS}=${Date.now()}`
          },
          httpAgent
        })
        egressHistTimerEnd({ success: true, operation: 'fspiop_put_quotes'})
      } catch(err) {
        logger.error(JSON.stringify(err))
        logger.error({
          traceparent: req.headers.traceparent,
          operation: 'fspiop_put_quotes',
          err,
        })
        egressHistTimerEnd({ success: false, operation: 'fspiop_put_quotes'})
      }
    })();
    // Sync 202
    res.status(202).end()
    histTimerEnd({ success: true, operation: 'fspiop_post_quotes'})
  })

  // Handle Payer PUT Quotes callback
  router.put('/quotes/*', (req, res) => {
    return handleCallback('quotes', req, res)
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
