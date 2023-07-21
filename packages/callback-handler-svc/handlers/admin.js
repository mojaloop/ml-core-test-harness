const express = require('express')
const env = require('env-var')

const init = (config, logger, options = undefined) => {
  const router = express.Router()
  const FSP_ID = env.get('FSPIOP_FSP_ID').default('perffsp2').asString()

  // Handle admin Get Participants request
  router.get('/participants/:id', (req, res) => {
   const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    const type = req.params.type
    const id = req.params.id
    const host = req.get('host')

    res.json(
      {
        "name": FSP_ID,
        "id": `http://central-ledger/participants/${FSP_ID}`,
        "created":"\"2023-07-20T04:04:06.000Z\"",
        "isActive":1,
        "links":{"self":`http://central-ledger/participants/${FSP_ID}`},
        "accounts":[
          {"id":15,"ledgerAccountType":"POSITION","currency":"USD","isActive":1,"createdDate":null,"createdBy":"unknown"},
          {"id":16,"ledgerAccountType":"SETTLEMENT","currency":"USD","isActive":1,"createdDate":null,"createdBy":"unknown"},
          {"id":17,"ledgerAccountType":"POSITION","currency":"BGN","isActive":1,"createdDate":null,"createdBy":"unknown"},
          {"id":18,"ledgerAccountType":"SETTLEMENT","currency":"BGN","isActive":1,"createdDate":null,"createdBy":"unknown"},
          {"id":19,"ledgerAccountType":"POSITION","currency":"INR","isActive":1,"createdDate":null,"createdBy":"unknown"},
          {"id":20,"ledgerAccountType":"SETTLEMENT","currency":"INR","isActive":1,"createdDate":null,"createdBy":"unknown"},
          {"id":21,"ledgerAccountType":"INTERCHANGE_FEE","currency":"INR","isActive":1,"createdDate":null,"createdBy":"unknown"},
          {"id":22,"ledgerAccountType":"INTERCHANGE_FEE_SETTLEMENT","currency":"INR","isActive":1,"createdDate":null,"createdBy":"unknown"}]
      })
   histTimerEnd({ success: true, operation: 'admin_get_participants'})

  })

  // Handle admin Get Participants request
  router.get('/participants/:id/endpoints', (req, res) => {
   const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
   //  const id = req.params.id
   //  const host = req.get('host')
    res.json(
      [
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_PUT",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_PUT_ERROR",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}/error"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_GET",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_PUT",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_SUB_ID_PUT",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_SUB_ID_PUT_ERROR",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}/error"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_GET",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_PUT",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_PUT_ERROR",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}/error"
        },
        {
           "type":"NET_DEBIT_CAP_ADJUSTMENT_EMAIL",
           "value":"{$inputs.email}"
        },
        {
           "type":"SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL",
           "value":"{$inputs.email}"
        },
        {
           "type":"NET_DEBIT_CAP_THRESHOLD_BREACH_EMAIL",
           "value":"{$inputs.email}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_BATCH_PUT",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/participants/{{requestId}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_BATCH_PUT_ERROR",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/participants/{{requestId}}/error"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_PUT_ERROR",
           "value":"http://monitoring-callback-handler-svc-1:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/error"
        }
     ]
    )
    histTimerEnd({ success: true, operation: 'admin_get_participants_endpoints'})
  })


  return {
    name: 'admin',
    basepath: '/admin',
    router
  }
}

// require-glob has no ES support
module.exports = {
  init
}
