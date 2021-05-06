import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CryptoCompareController } from './crypto-compare.controller';
import { CryptoCompareService } from './crypto-compare.service';

@Module({
    imports: [
        ConfigModule,
        CacheModule.register(),
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: Number(configService.get('HTTP_TIMEOUT')),
                maxRedirects: Number(configService.get('HTTP_MAX_REDIRECTS'))
            }),
            inject: [ConfigService]
        })
    ],
    providers: [CryptoCompareService],
    controllers: [CryptoCompareController]
})
export class CryptoCompareModule {}
