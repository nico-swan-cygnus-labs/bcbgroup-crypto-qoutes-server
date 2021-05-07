import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SymbolPrice } from './crypto-compare/crypto-compare.interface';

@WebSocketGateway(parseInt(process.env.BCB_WEBSOCKET_PORT || '3001'))
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private logger: Logger = new Logger('AppGateway');

    nrActiveConnections: number;
    activeClients: Map<string, Socket>;

    @WebSocketServer() server: Server;
    constructor(private eventEmitter: EventEmitter2) {
        this.nrActiveConnections = 0;
        this.activeClients = new Map();
    }

    /**
     * Send the quote to all the clients
     * @param payload SymbolPrice Reduced quote price from the cryptocompare stream
     * @emits SymbolPrice
     */
    @OnEvent('quote')
    handleSendQuoteEvent(payload: SymbolPrice) {
        this.logger.debug('Emit quote:' + JSON.stringify(payload));
        this.server.emit('quote', payload);
    }

    /**
     * Handel After Websocket gateway was initialize
     * @param server The websocket server
     */
    afterInit(server: Server) {
        this.logger.log('Initialized! Maximum listeners is ' + server.getMaxListeners());
    }

    /**
     * Handel after client disconnect
     * @param client The websocket client
     * @returns none
     */
    handleDisconnect(client: Socket) {
        if (this.nrActiveConnections) {
            this.nrActiveConnections--;
            this.activeClients.delete(client.id);
            this.eventEmitter.emit('client-disconnected', client.id);
        }
        this.logger.debug(`Client disconnected: ${client.id} - ${this.nrActiveConnections}`);
    }

    /**
     * Handel after client connect
     * @param client The websocket client
     * @returns none
     */
    handleConnection(client: Socket) {
        this.nrActiveConnections++;
        this.activeClients.set(client.id, client);
        this.eventEmitter.emit('client-connected', client.id);
        this.logger.debug(
            `Client connected: ${client.id} - client ${this.server.clients.length} - ${this.nrActiveConnections}`
        );
    }
}
