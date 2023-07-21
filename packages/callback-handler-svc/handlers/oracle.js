const express = require('express')

const init = (depConfig, _userConfig, logger, options = undefined) => {
  const router = express.Router()

  // Handle Oracle GET Participants request
  router.get('/participants/:type/:id', (req, res) => {
    const histTimerEnd = depConfig.metrics.getHistogram(
      'ing_callbackHandler',
      'Ingress - Operation handler',
      ['success', 'operation']
    ).startTimer()
    res.status(200)
    res.json({
      "partyList":[{"fspId":"perffsp2","currency":"USD"}]
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
