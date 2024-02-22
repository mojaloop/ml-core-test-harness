const express = require('express')
const env = require('env-var')
const { TraceUtils } = require('@callback-handler-svc/utils')

const TRACESTATE_KEY_END2END_START_TS = 'tx_end2end_start_ts'
const TRACESTATE_KEY_CALLBACK_START_TS = 'tx_callback_start_ts'


const init = (config, logger, options = undefined) => {
  const router = express.Router()

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
    console.log('Handled PUT Callback request', channel)
    options.wsServer.notify(channel, isErrorOperation ? 'ERROR_CALLBACK_RECEIVED' : 'SUCCESS_CALLBACK_RECEIVED')
    histTimerEnd({ success: true, operation })
    return res.status(202).end()
  }


  // Handle Oracle GET Participants request
  router.get('/parties/:type/:id', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    const type = req.params.type
    const id = req.params.id

    res.status(202).json({
      "idType": type,
      "idValue": id,
      "fsp": "string"
    })
    console.log('Handled GET request')
    histTimerEnd({ success: true, operation: 'oracle_get_parties'})
  })

  // Handle Quote Request
  router.post('/quoterequests', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    const quotesRequest = req.body

    const quotesResponse = {
      payeeFspCommissionAmount: quotesRequest.feesCurrency,
      payeeFspCommissionAmountCurrency: quotesRequest.feesCurrency,
      payeeFspFeeAmount: quotesRequest.feesAmount,
      payeeFspFeeAmountCurrency: quotesRequest.feesCurrency,
      // Fee currency and currency should be the same in order to have the right value
      payeeReceiveAmount: (Number(quotesRequest.amount) - Number(quotesRequest.feesAmount)),
      payeeReceiveAmountCurrency: quotesRequest.currency,
      quoteId: quotesRequest.quoteId,
      transactionId: quotesRequest.transactionId,
      transferAmount: quotesRequest.amount,
      transferAmountCurrency: quotesRequest.currency,
      expiration: new Date(new Date().getTime() + 10000)
    }

    res.status(202).json(quotesResponse)

    histTimerEnd({ success: true, operation: 'quoting_service_post_quote' })
  })

  // Handle Transfer Request
  router.post('/transfers', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()

    const quotesResponse = {
      completedTimestamp: new Date(new Date().getTime() + 10000),
      fulfilment: 'lnYe4rYwLthWbzhVyX5cAuDfL1Ulw4WdaTgyGDREysw',
      homeTransactionId: req.body.homeR2PTransactionId,
      transferState: 'RECEIVED'
    }

    res.status(202).json(quotesResponse)

    histTimerEnd({ success: true, operation: 'transfers_post_transfer' })
  })

  router.put('/parties/:type/:id', (req, res) => {
    return handleCallback('parties', req, res)
  })

  router.put('/quotes/:id', (req, res) => {
    return handleCallback('quotes', req, res)
  })

  router.put('/transfers/:id', (req, res) => {
    return handleCallback('transfers', req, res)
  })

  return {
    name: 'backend',
    basepath: '/backend',
    router
  }
}

// require-glob has no ES support
module.exports = {
  init
}
