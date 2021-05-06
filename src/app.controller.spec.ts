import { CacheModule, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let controller: AppController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    cache: true
                }),
                HttpModule,
                CacheModule.register(),
                EventEmitterModule.forRoot()
            ],
            providers: [AppService],
            controllers: [AppController]
        }).compile();

        controller = module.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return html for documentation', () => {
            expect(controller.getHello()).toBe('<a href="/api/">Documentation available<a>');
        });
    });
});
