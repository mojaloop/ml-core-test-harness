
const init = (express, metrics, logger, date, wsServer, axios, options = undefined) => {
  const router = express.Router()

  // Handle Oracle GET Participants request
  router.get('/participants/:type/:id', (req, res) => {
    res.status(200)
    res.json({
      "partyList":[{"fspId":"perffsp2","currency":"USD"}]
    })
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
