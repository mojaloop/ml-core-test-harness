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

 - Vijaya Kumar Guthi <vijaya.guthi@modusbox.com>
 - Kevin Leyow <kevin.leyow@infitx.com>

 --------------
 ******/

import { logger } from '~/shared/logger'
const path = require('path')
const { spawn } = require('child_process')

var targetScript = path.join(__dirname, 'loggerTester.ts')
const spawnLoggerTest = () => {
  return new Promise((resolve, reject) => {
    var child = spawn('ts-node', [targetScript], { stdio: 'pipe' })
    var data = ''

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', function (str: any) { data += str; });
    child.on('close', function () {
      resolve(data);
    })

    child.stderr.setEncoding('utf8')
    child.stderr.on('data', function (str: any) { data += str; });
    child.on('close', function () {
      reject('Error executing test file')
    })
  })
}

describe('shared/logger', (): void => {
  describe('Logger module', () => {
    it('should have proper layout', () => {
      expect(typeof logger.verbose).toEqual('function')
      expect(typeof logger.debug).toEqual('function')
      expect(typeof logger.warn).toEqual('function')
      expect(typeof logger.error).toEqual('function')
      expect(typeof logger.info).toEqual('function')
    })
    it('logs out multiple params - 2 strings', async () => {
      const output = <string> await spawnLoggerTest()
      expect(output.includes('INFO_MESSAGE')).toBe(true)
    })
  })
})
