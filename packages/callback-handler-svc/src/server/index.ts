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

type TracestateMap = {
  tx_end2end_start_ts: number | undefined;
  tx_callback_start_ts: number | undefined;
}
const app = express()
let appInstance: http.Server

function getTraceStateMap (headers: any): TracestateMap {
  const tracestate: string = headers.tracestate
  if (tracestate === undefined) {
    return {
      tx_end2end_start_ts: undefined,
      tx_callback_start_ts: undefined
    }
  }
  let tracestates = {}
  tracestate
    .split(',')
    .map(ts => ts.split('='))
    .map(([k, v]) => {
      return { [k]: Number(v) }
    })
    .forEach(ts => {
      tracestates = { ...tracestates, ...ts }
    })
  return tracestates as TracestateMap
}

async function run (): Promise<void> {
  const metricsConfig = {
    timeout: 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
    prefix: 'tx_', // Set prefix for all defined metrics names
    defaultLabels: { // Set default labels that will be applied to all metrics
      serviceName: 'callback-handler-svc'
    }
  }

  Metrics.setup(metricsConfig)

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
  app.get(['/:operation', '/:operation/*'], async (req, res) => {
    const currentTime = Date.now()
    const path = req.path
    const isErrorOperation = path.endsWith('error')
    let operation = req.params.operation
    if (isErrorOperation) {
      operation = operation + '_error'
    }
    const operationE2e = `${operation}_end2end`
    const operationRequest = `${operation}_request`
    const operationResponse = `${operation}_response`
    const tracestate = getTraceStateMap(req.headers)
    if (tracestate.tx_end2end_start_ts === undefined || tracestate.tx_callback_start_ts === undefined) {
      return res.status(400).send('tx_end2end_start_ts or tx_callback_start_ts key/values not found in tracestate')
    }
    const e2eDelta = currentTime - tracestate.tx_end2end_start_ts
    const requestDelta = tracestate.tx_callback_start_ts - tracestate.tx_end2end_start_ts
    const responseDelta = currentTime - tracestate.tx_callback_start_ts

    const operationHistogram = Metrics.getHistogram(
      'cb_perf',
      'Metrics for callbacks',
      ['success', 'path', 'operation']
    )

    operationHistogram.observe({
      success: (!isErrorOperation).toString(),
      path,
      operation: operationE2e
    }, e2eDelta / 1000)
    operationHistogram.observe({
      success: (!isErrorOperation).toString(),
      path,
      operation: operationRequest
    }, requestDelta / 1000)
    operationHistogram.observe({
      success: (!isErrorOperation).toString(),
      path,
      operation: operationResponse
    }, responseDelta / 1000)

    return res.json({
      tracestate,
      operation,
      path,
      isErrorOperation,
      serverHandlingTime: currentTime,
      [operationE2e]: e2eDelta,
      [operationRequest]: requestDelta,
      [operationResponse]: responseDelta
    })
  })

  appInstance = app.listen(Config.PORT)
  Logger.info(`service is running on port ${Config.PORT}`)
}

async function terminate (): Promise<void> {
  appInstance.close()
  Logger.info('service stopped')
}

function getApp (): any {
  return app
}

export default {
  run,
  getApp,
  terminate
}
