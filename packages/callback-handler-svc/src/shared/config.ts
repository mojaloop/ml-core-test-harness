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

import Convict from 'convict'
import path from 'path'

// interface to represent service configuration
export interface ServiceConfig {
  // API Server
  PORT: number;
  HOST: string;
  WS_SERVER: {
    ENABLED: boolean
    PORT: number
  }
  INSTRUMENTATION: {
    METRICS: {
      DISABLED: boolean
      config: {
        timeout: number
        prefix: string
        defaultLabels?: {
          serviceName: string
        }
      }
    }
  };
}

// Declare configuration schema, default values and bindings to environment variables
export const ConvictConfig = Convict<ServiceConfig>({
  HOST: {
    doc: 'The Hostname/IP address of app',
    format: '*',
    default: 'localhost',
    env: 'HOST'
  },
  PORT: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3001,
    env: 'PORT'
  },
  WS_SERVER: {
    ENABLED: {
      doc: 'Boolean for enabling websocket server',
      format: Boolean,
      default: true,
      env: 'WS_SERVER_ENABLED'
    },
    PORT: {
      doc: 'The port to bind for websocket server',
      format: 'port',
      default: 3002,
      env: 'WS_SERVER_PORT'
    }
  },
  INSTRUMENTATION: {
    METRICS: {
      DISABLED: {
        doc: 'Boolean for disabling metrics',
        format: Boolean,
        default: false,
        env: 'INSTRUMENTATION_METRICS_DISABLED'
      },
      config: {
        timeout: {
          doc: 'Timeout in ms for the underlying prom-client library',
          format: Number,
          default: 5000,
          env: 'INSTRUMENTATION_METRICS_CONFIG_TIMEOUT'
        },
        prefix: {
          doc: 'Prefix for all defined metrics names',
          default: 'tx_',
          format: String,
          env: 'INSTRUMENTATION_METRICS_CONFIG_PREFIX'
        },
        defaultLabels: {
          serviceName: {
            doc: 'Default labels that will be applied to all metrics',
            format: String,
            default: 'callback-handler-svc',
            env: 'INSTRUMENTATION_METRICS_CONFIG_DEFAULT_LABELS_SERVICE_NAME'
          }
        }
      }
    }
  }
})

// Load environment dependent configuration
const configFile = process.env.CONFIG_FILE || path.join(__dirname, '../../config/default.json')
if (configFile) {
  ConvictConfig.loadFile(configFile)
}

// Perform configuration validation
ConvictConfig.validate({ allowed: 'strict' })

// extract simplified config from Convict object
const config: ServiceConfig = {
  HOST: ConvictConfig.get('HOST'),
  PORT: ConvictConfig.get('PORT'),
  WS_SERVER: ConvictConfig.get('WS_SERVER'),
  INSTRUMENTATION: ConvictConfig.get('INSTRUMENTATION')
}

export default config
