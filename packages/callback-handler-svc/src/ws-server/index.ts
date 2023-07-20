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

 - Vijay Kumar Guthi <vijaya.guthi@infitx.com>

 --------------
 ******/

// import * as WebSocket from 'ws';
import { Server as WebSocketServer, WebSocket } from 'ws';
import {
  // Agent,
  // ClientRequest,
  // ClientRequestArgs,
  IncomingMessage,
  // OutgoingHttpHeaders,
  // Server as HTTPServer,
} from "http";
import { logger } from '../shared/logger';
import Config from '../shared/config';

export class WSServer {
  wsServer: WebSocketServer;
  wsClientMap: {[key: string]: WebSocket};
  constructor() {
    this.wsServer = new WebSocketServer({ port: Config.WS_SERVER.PORT });
    this.wsClientMap = {}

    this.wsServer.on("listening", () => {
      logger.info(`Websocket server is running on port ${Config.WS_SERVER.PORT}`)
    });

    this.wsServer.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      logger.debug('Connection established for client channel ' + req.url);
      this.wsClientMap[req.url as string] = ws;
    
      // Listen to the message coming from client.
      ws.on("message", (message) => {
        logger.debug(`Message from client: ${message}`);
      });
    
      // Clearing up when client closes web socket connection
      ws.on("close", () => {
        logger.debug('Client connection closed');
        delete this.wsClientMap[req.url as string];
      });
    });
  }

  // Broadcast to all.
  broadcast (message: string) {
    logger.debug(`Broadcasting to all clients: ${message}`);
    this.wsServer.clients.forEach(function each(client) {
      client.send(message);
    });
  };

  notify (channel:string, message: string) {
    logger.debug(`Notifying channel ${channel}: ${message}`);
    // TODO: refine the following. Handle errors cases ...etc
    this.wsClientMap[channel]?.send(message);
  };
  
}
