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

    const partyToFspIdMap = {
      "19012345001": 'perffsp1',
      "19012345002": 'perffsp2',
      "19012345003": 'perffsp3',
      "19012345004": 'perffsp4',
      "19012345005": 'perffsp5',
      "19012345006": 'perffsp6',
      "19012345007": 'perffsp7',
      "19012345008": 'perffsp8'
    }

    const id = req.params.id
    res.status(200).json({
      "partyList":[
        {
          "fspId": partyToFspIdMap[id],
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
