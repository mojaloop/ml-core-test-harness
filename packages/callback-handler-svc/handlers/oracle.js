const express = require('express')

const init = (config, logger, options = undefined) => {
  const router = express.Router()
  const FSP_ID = env.get('FSPIOP_FSP_ID').default('perffsp2').asString()

  // Handle Oracle GET Participants request
  router.get('/participants/:type/:id', (req, res) => {
    const histTimerEnd = options.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    res.status(200)
    res.json({
      "partyList":[{"fspId":FSP_ID,"currency":"USD"}]
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
