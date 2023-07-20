/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

// workaround for lack of typescript types for mojaloop dependencies
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../ambient.d.ts"/>
/* eslint-disable camelcase */
import express from 'express'
import http from 'http'
import Config from '../shared/config'
import Logger from '@mojaloop/central-services-logger'
import Metrics from '@mojaloop/central-services-metrics'
import { logger } from '../shared/logger'
import { WSServer } from '../ws-server'
import Utils from '../shared/utils'

import axios from 'axios'
const requireGlob = require('require-glob')

const app = express()
let appInstance: http.Server

async function run (wsServer: WSServer): Promise<void> {
  const rulesList = await requireGlob('../../rules/**.js')
  Logger.isInfoEnabled && Logger.info(`Rule imports found ${JSON.stringify(rulesList)}`)
  // e.g. https://www.npmjs.com/package/require-glob
  // import all imports from "working-dir/rules/*.js"(options) into rulesList
  for (const key in rulesList) {
    if (Object.prototype.hasOwnProperty.call(rulesList[key], 'init')) {
      const handlerObject = rulesList[key]
      const rules = handlerObject.init(express, Metrics, Logger, Date, wsServer, axios, Utils)
      app.use(rules.basepath, rules.router)
    }
  }

  logger.info(Config)
  if (!Config.INSTRUMENTATION.METRICS.DISABLED) {
    Metrics.setup(Config.INSTRUMENTATION.METRICS.config)
  }

  app.use(express.json())
  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK'
    })
  })

  app.get('/metrics', async (_req, res) => {
    res.status(200)
    res.send(await Metrics.getMetricsForPrometheus())
  })
  appInstance = app.listen(Config.PORT)
  Logger.isInfoEnabled && Logger.info(`Service is running on port ${Config.PORT}`)
}

async function terminate (): Promise<void> {
  appInstance.close()
  Logger.isInfoEnabled && Logger.info('service stopped')
}

function getApp (): any {
  return app
}

export default {
  run,
  getApp,
  terminate
}
