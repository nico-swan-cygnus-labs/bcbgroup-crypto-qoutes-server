import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import * as io from 'socket.io-client';
import { AppGateway } from './app.gateway';
import { AppModule } from './app.module';

export const getClientWebsocketForAppAndNamespace = (app: NestExpressApplication, namespace: string, query?: any) => {
    const httpServer = app.getHttpServer();
    if (!httpServer.address()) {
        httpServer.listen(0);
    }

    return io(`http://127.0.0.1:${httpServer.address().port}/${namespace}`, {
        query
    });
};

describe.skip('AppGateway', () => {
    let gateway: AppGateway;
    let app: NestExpressApplication;

    beforeEach(async () => {
        app = await NestFactory.create<NestExpressApplication>(AppModule);

        const module: TestingModule = await Test.createTestingModule({
            providers: [AppGateway]
        }).compile();

        gateway = module.get<AppGateway>(AppGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('does not throw an exception because I have a exception filter', (done) => {
        const socket = getClientWebsocketForAppAndNamespace(app, 'some-namespace');

        socket.on('connect', () => {
            socket.emit('some-event');
        });

        socket.on('exception', (exception) => {
            expect(exception).toEqual({
                message: 'not ok'
            });

            socket.close();
            done();
        });
    });
});
