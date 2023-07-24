const express = require('express')
const env = require('env-var')

const init = (config, logger, options = undefined) => {
  const router = express.Router()

  // Handle Oracle GET Participants request
  router.get('/participants/:type/:id', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    const id = req.params.id
    res.status(200).json({
      "partyList":[
        {
          "fspId":id,
          "currency":"USD"
        }
      ]
    })

    histTimerEnd({ success: true, operation: 'oracle_get_participants'})
  })

  return {
    name: 'oracle',
    basepath: '/oracle',
    router
  }
}

// require-glob has no ES support
module.exports = {
  init
}
