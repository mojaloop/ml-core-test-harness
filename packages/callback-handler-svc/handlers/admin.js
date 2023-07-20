const express = require('express')

const init = (depConfig, _userConfig, logger, options = undefined) => {
  const router = express.Router()

  // Handle admin Get Participants request
  router.get('/participants/:id', (req, res) => {
    const type = req.params.type
    const id = req.params.id
    const host = req.get('host')
    res.json(
      {
        "name":"perffsp2",
        "id":"http://central-ledger/participants/perffsp2",
        "created":"\"2023-07-20T04:04:06.000Z\"",
        "isActive":1,
        "links":{"self":"http://central-ledger/participants/perffsp2"},
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
  })

  // Handle admin Get Participants request
  router.get('/participants/:id/endpoints', (req, res) => {
    const id = req.params.id
    const host = req.get('host')
    res.json(
      [
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_PUT",
           "value":"http://callback-handler-svc:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_PUT_ERROR",
           "value":"http://callback-handler-svc:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}/error"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_GET",
           "value":"http://callback-handler-svc:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_PUT",
           "value":"http://callback-handler-svc:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_SUB_ID_PUT",
           "value":"http://callback-handler-svc:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_SUB_ID_PUT_ERROR",
           "value":"http://callback-handler-svc:3001/fspiop/participants/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}/error"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_GET",
           "value":"http://callback-handler-svc:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_PUT",
           "value":"http://callback-handler-svc:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_SUB_ID_PUT_ERROR",
           "value":"http://callback-handler-svc:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/{{partySubIdOrType}}/error"
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
           "value":"http://callback-handler-svc:3001/fspiop/participants/{{requestId}}"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTICIPANT_BATCH_PUT_ERROR",
           "value":"http://callback-handler-svc:3001/fspiop/participants/{{requestId}}/error"
        },
        {
           "type":"FSPIOP_CALLBACK_URL_PARTIES_PUT_ERROR",
           "value":"http://callback-handler-svc:3001/fspiop/parties/{{partyIdType}}/{{partyIdentifier}}/error"
        }
     ]
    )
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
