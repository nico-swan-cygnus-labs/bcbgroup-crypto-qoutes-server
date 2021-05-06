import { CacheInterceptor, CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppGateway } from './app.gateway';
import { AppService } from './app.service';
import { CryptoCompareModule } from './crypto-compare/crypto-compare.module';

@Module({
    imports: [
        CacheModule.register(),
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true
        }),
        EventEmitterModule.forRoot(),
        CryptoCompareModule
    ],
    controllers: [AppController],
    providers: [
        AppService,
        AppGateway,
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptor
        }
    ]
})
export class AppModule {}
