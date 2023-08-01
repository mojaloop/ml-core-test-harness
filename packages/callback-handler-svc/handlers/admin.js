const express = require('express')
const env = require('env-var')

const init = (config, logger, options = undefined) => {
  const router = express.Router()
  const FSP_ENDPOINT_MAP = env.get('CBH_ADMIN_FSP_ENDPOINT_MAP').default('{}').asString()
  const FSPIOP_ALS_ENDPOINT_URL = env.get('CBH_FSPIOP_ALS_ENDPOINT_URL').default('http://central-ledger').asString()

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

    res.status(200).json(
      {
        "name": id,
        "id": `${FSPIOP_ALS_ENDPOINT_URL}/participants/${id}`,
        "created":"\"2023-07-20T04:04:06.000Z\"",
        "isActive":1,
        "links":{"self":`${FSPIOP_ALS_ENDPOINT_URL}/participants/${id}`},
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

   const id = req.params.id
   const fspMap = JSON.parse(FSP_ENDPOINT_MAP)
   const ADMIN_FSPIOP_CALLBACK_URL = fspMap[id]

   res.status(200).json(
      [
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_PUT",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/participants/{{partyIdType}}/{{partyIdentifier}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_PUT_ERROR",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/participants/{{partyIdType}}/{{partyIdentifier}}/error`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_GET",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/parties/{{partyIdType}}/{{partyIdentifier}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_PUT",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/parties/{{partyIdType}}/{{partyIdentifier}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_SUB_ID_PUT",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/participants/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_SUB_ID_PUT_ERROR",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/participants/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}/error`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_GET",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_PUT",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_PUT_ERROR",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}/error`
        },
        {
           "type":"NET_DEBIT_CAP_ADJUSTMENT_EMAIL",
           "value":"test@test.test"
        },
        {
           "type":"SETTLEMENT_TRANSFER_POSITION_CHANGE_EMAIL",
           "value":"test@test.test"
        },
        {
           "type":"NET_DEBIT_CAP_THRESHOLD_BREACH_EMAIL",
           "value":"test@test.test"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_BATCH_PUT",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/participants/{{requestId}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_BATCH_PUT_ERROR",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/participants/{{requestId}}/error`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_PUT_ERROR",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/parties/{{partyIdType}}/{{partyIdentifier}}/error`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_QUOTES",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_TRANSFER_POST",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/transfers`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_TRANSFER_PUT",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/transfers/{{transferId}}`
        },
        {
           "type":"FSPIOP_CALLBACK_URL_TRANSFER_ERROR",
           "value":`${ADMIN_FSPIOP_CALLBACK_URL}/transfers/{{transferId}}/error`
        },
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
