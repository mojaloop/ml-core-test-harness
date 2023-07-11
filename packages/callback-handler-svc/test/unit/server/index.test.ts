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

 - Vijay Kumar Guthi <vijaya.guthi@modusbox.com>
 - Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

import { performance } from 'perf_hooks'
import Server from '../../../src/server'
import request from 'supertest'

describe('start', () => {
  beforeAll(() => {
    Server.run()
  })
  afterAll(() => {
    Server.terminate()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('health endpoint should work', async () => {
    const app = Server.getApp()
    const result = await request(app).get('/health')
    let jsonResult: any = {}
    expect(() => { jsonResult = JSON.parse(result.text) }).not.toThrowError()
    expect(result.statusCode).toEqual(200)
    expect(jsonResult).toHaveProperty('status')
    expect(jsonResult.status).toEqual('OK')
  })
  it('wildcard endpoint success callback should work', async () => {
    const app = Server.getApp()
    const e2eStart = new Date(Date.now() - 1000 * 5).valueOf()
    const e2eCallbackStart = new Date(Date.now() - 1000 * 3).valueOf()
    const result = await
    request(app)
      .get('/test/111')
      .set('tracestate', `tx_end2end_start_ts=${e2eStart},tx_callback_start_ts=${e2eCallbackStart}`)
    let jsonResult: any = {}
    expect(() => { jsonResult = JSON.parse(result.text) }).not.toThrowError()
    expect(result.statusCode).toEqual(200)
    expect(jsonResult).toHaveProperty('path')
    expect(jsonResult).toHaveProperty('operation')
    expect(jsonResult).toHaveProperty('isErrorOperation')
    expect(jsonResult).toHaveProperty('tracestate')
    expect(jsonResult).toHaveProperty('serverHandlingTime')

    expect(jsonResult.path).toEqual('/test/111')
    expect(jsonResult.operation).toEqual('test')
    expect(jsonResult.isErrorOperation).toEqual(false)
    expect(jsonResult.tracestate.tx_end2end_start_ts).toEqual(e2eStart)
    expect(jsonResult.tracestate.tx_callback_start_ts).toEqual(e2eCallbackStart)
    expect(jsonResult.test_request).toEqual(
      jsonResult.tracestate.tx_callback_start_ts - jsonResult.tracestate.tx_end2end_start_ts
    )
  })

  it('wildcard endpoint error callback should work', async () => {
    const app = Server.getApp()
    const e2eStart = new Date(Date.now() - 1000 * 5).valueOf()
    const e2eCallbackStart = new Date(Date.now() - 1000 * 3).valueOf()
    const result = await
    request(app)
      .get('/test/111/error')
      .set('tracestate', `tx_end2end_start_ts=${e2eStart},tx_callback_start_ts=${e2eCallbackStart}`)
    let jsonResult: any = {}
    expect(() => { jsonResult = JSON.parse(result.text) }).not.toThrowError()
    expect(result.statusCode).toEqual(200)
    expect(jsonResult).toHaveProperty('path')
    expect(jsonResult).toHaveProperty('operation')
    expect(jsonResult).toHaveProperty('isErrorOperation')
    expect(jsonResult).toHaveProperty('tracestate')
    expect(jsonResult).toHaveProperty('serverHandlingTime')

    expect(jsonResult.path).toEqual('/test/111/error')
    expect(jsonResult.operation).toEqual('test_error')
    expect(jsonResult.isErrorOperation).toEqual(true)
    expect(jsonResult.tracestate.tx_end2end_start_ts).toEqual(e2eStart)
    expect(jsonResult.tracestate.tx_callback_start_ts).toEqual(e2eCallbackStart)
    expect(jsonResult.test_error_request).toEqual(
      jsonResult.tracestate.tx_callback_start_ts - jsonResult.tracestate.tx_end2end_start_ts
    )
  })

  it('wildcard endpoint should throw error when tracestate key values are not found', async () => {
    const app = Server.getApp()
    const result = await
    request(app)
      .get('/test/error')
      .set('tracestate', '')
    expect(result.statusCode).toEqual(400)
  })

  it('wildcard endpoint should throw error when tracestate header is not set', async () => {
    const app = Server.getApp()
    const result = await
    request(app)
      .get('/test/error')
    const jsonResult: any = {}
    expect(result.statusCode).toEqual(400)
  })
})
