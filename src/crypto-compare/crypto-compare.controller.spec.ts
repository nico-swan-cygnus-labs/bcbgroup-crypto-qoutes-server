import { CacheModule, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { CryptoCompareController } from './crypto-compare.controller';
import { SymbolPrice, SymbolSignals } from './crypto-compare.interface';
import { CryptoCompareService } from './crypto-compare.service';

class ApiServiceMock {
    getPricePair(_symbolStr: string, _currencyStr: string): Promise<SymbolPrice> {
        return Promise.resolve({
            symbol: _symbolStr,
            currency: _currencyStr,
            price: 9999
        });
    }
    getPricePairs(_symbolArr: string[], _currencyArr: string[]): Promise<any> {
        return Promise.resolve({
            BTC: {
                USD: 11111,
                GBP: 11111
            },
            ETH: {
                USD: 22222,
                GBP: 22222
            }
        });
    }
    getDailyHistoryPair(_symbol: string, _currency: string, length?: number): Promise<any> {
        return Promise.resolve({
            symbol: _symbol,
            currency: _currency,
            length: length,
            data: [
                {
                    time: 1111111111,
                    value: 99999
                },
                {
                    time: 2222222222,
                    value: 88888
                },
                {
                    time: 3333333333,
                    value: 77777
                }
            ]
        });
    }
    getTradingSignal(symbol: string): Promise<SymbolSignals> {
        const result: SymbolSignals = {
            symbol: symbol,
            time: 1111111111,
            signals: [
                {
                    name: 'inOutVar',
                    sentiment: 'bullish',
                    score: 0
                },
                {
                    name: 'largetxsVar',
                    sentiment: 'bullish',
                    score: 0.1
                },
                {
                    name: 'addressesNetGrowth',
                    sentiment: 'bearish',
                    score: 0.2
                },
                {
                    name: 'concentrationVar',
                    sentiment: 'neutral',
                    score: 0.3
                }
            ]
        };
        return Promise.resolve(result);
    }
}

describe('CryptoCompareController', () => {
    let controller: CryptoCompareController;

    beforeAll(async () => {
        const ApiServiceProvider = {
            provide: CryptoCompareService,
            useClass: ApiServiceMock
        };
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
            providers: [CryptoCompareService, ApiServiceProvider],
            controllers: [CryptoCompareController]
        }).compile();

        controller = module.get<CryptoCompareController>(CryptoCompareController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should get a crypto currency pair.', async () => {
        const response = await controller.quote('BTC', 'USD');
        expect(response.symbol).toBe('BTC');
        expect(response.currency).toBe('USD');
        expect(response.price).toBe(9999);
    });

    it('should get a crypto currency pairs.', async () => {
        const response = await controller.quotes('BTC,ETC', 'USD,GBP');
        expect(response).toHaveProperty('BTC');
        expect(response).toHaveProperty('ETH');
        expect(response.BTC).toHaveProperty('USD');
        expect(response.BTC).toHaveProperty('GBP');
        expect(response.BTC.USD).toBe(11111);
        expect(response.BTC.GBP).toBe(11111);
        expect(response.ETH).toHaveProperty('USD');
        expect(response.ETH).toHaveProperty('GBP');
        expect(response.ETH.USD).toBe(22222);
        expect(response.ETH.GBP).toBe(22222);
    });

    it('should return a crypto history on closing price for a number of days.', async () => {
        const response = await controller.dailyHistory('BTC', 'USD', 2);
        expect(response.symbol).toBe('BTC');
        expect(response.currency).toBe('USD');
        expect(response.length).toBe(2);
        expect(response.data).toHaveLength(3);
        expect(response.data[0].time).toBe(1111111111);
        expect(response.data[1].time).toBe(2222222222);
        expect(response.data[2].time).toBe(3333333333);
        expect(response.data[0].value).toBe(99999);
        expect(response.data[1].value).toBe(88888);
        expect(response.data[2].value).toBe(77777);
    });
});
