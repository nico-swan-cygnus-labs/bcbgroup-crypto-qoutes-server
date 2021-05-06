import { CacheModule, HttpModule, HttpService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import * as WebSocket from 'ws';
import { CryptoCompareService } from './crypto-compare.service';

// Sample CryptoCompare
const ccApiOutSamples = {
    singleQuote: {
        BTC: {
            USD: 9999.99
        }
    },
    multipleQuotes: {
        BTC: {
            USD: 9999.99,
            GBP: 8888.88
        },
        ETH: {
            USD: 7777.77,
            GBP: 6666.66
        }
    },
    historical3Day: {
        Response: 'Success',
        Type: 100,
        Aggregated: false,
        TimeTo: 1620259200,
        TimeFrom: 1619654400,
        FirstValueInArray: true,
        ConversionType: { type: 'direct', conversionSymbol: '' },
        Data: [
            {
                time: 1619654400,
                high: 55217.24,
                low: 52399.42,
                open: 54877.94,
                volumefrom: 43948.76,
                volumeto: 2359198137.55,
                close: 53581.58,
                conversionType: 'direct',
                conversionSymbol: ''
            },
            {
                time: 1619740800,
                high: 57984.34,
                low: 53089.93,
                open: 53581.58,
                volumefrom: 48771,
                volumeto: 2719315702.2,
                close: 57757.97,
                conversionType: 'direct',
                conversionSymbol: ''
            },
            {
                time: 1619827200,
                high: 58498.65,
                low: 57057.4,
                open: 57757.97,
                volumefrom: 26146.3,
                volumeto: 1511783659.93,
                close: 57843.16,
                conversionType: 'direct',
                conversionSymbol: ''
            },
            {
                time: 1619913600,
                high: 57934.82,
                low: 56092.72,
                open: 57843.16,
                volumefrom: 21671.56,
                volumeto: 1230710822.31,
                close: 56623.51,
                conversionType: 'direct',
                conversionSymbol: ''
            }
        ],
        RateLimit: {},
        HasWarning: false
    },
    tradingSignals: {
        Response: 'Success',
        Message: '',
        HasWarning: false,
        Type: 100,
        RateLimit: {},
        Data: {
            id: 1182,
            time: 1620086400,
            symbol: 'BTC',
            partner_symbol: 'BTC',
            inOutVar: {
                category: 'on_chain',
                sentiment: 'neutral',
                value: 0.0019511052799410136,
                score: 0.4648665690099305,
                score_threshold_bearish: 0.25,
                score_threshold_bullish: 0.75
            },
            largetxsVar: {
                category: 'on_chain',
                sentiment: 'bearish',
                value: -0.014013772624059215,
                score: 0,
                score_threshold_bearish: 0.25,
                score_threshold_bullish: 0.75
            },
            addressesNetGrowth: {
                category: 'on_chain',
                sentiment: 'bearish',
                value: 0.0038485122982752475,
                score: 0.22305398677108992,
                score_threshold_bearish: 0.25,
                score_threshold_bullish: 0.75
            },
            concentrationVar: {
                category: 'on_chain',
                sentiment: 'bullish',
                value: 0.0016150875668627543,
                score: 0.7756286486192814,
                score_threshold_bearish: 0.25,
                score_threshold_bullish: 0.75
            }
        }
    },
    wsQuoteMessage: {
        TYPE: 5,
        MARKET: 'CCCAGG',
        FROMSYMBOL: 'BTC',
        TOSYMBOL: 'USD',
        FLAGS: 1,
        PRICE: 9999.99,
        MEDIAN: 9999.99
    },
    subscribeMsgString: JSON.stringify({
        action: 'SubAdd',
        subs: ['5~CCCAGG~BTC~USD', '5~CCCAGG~BTC~GBP', '5~CCCAGG~ETH~USD', '5~CCCAGG~ETH~GBP']
    })
};

const compileModule = async function (_wsServerUrl: string) {
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
        providers: [
            CryptoCompareService,
            {
                provide: ConfigService,
                useValue: {
                    get: jest.fn((key: string) => {
                        if (key === 'BCB_DEFAULT_PAIRS') {
                            return 'BTC,ETH';
                        }
                        if (key === 'BCB_DEFAULT_CURRENCIES') {
                            return 'USD,GBP';
                        }
                        if (key === 'BCB_BASE_REST_URL') {
                            return 'http://localhost';
                        }
                        if (key === 'BCB_API_KEY') {
                            return undefined;
                        }
                        if (key === 'BCB_WEBSOCKET_URL') {
                            return _wsServerUrl;
                        }
                        return null;
                    })
                }
            }
        ]
    }).compile();
    return module;
};

describe('CryptoCompareService', () => {
    let httpService: HttpService;
    let service: CryptoCompareService;
    let wsServer: WebSocket.Server;
    const wsServerUrl = 'ws://localhost:1234';

    afterEach(async () => {
        wsServer.close();
    });

    beforeEach(async () => {
        wsServer = new WebSocket.Server({ port: 1234, noServer: true });
        const module: TestingModule = await compileModule(wsServerUrl);
        service = module.get<CryptoCompareService>(CryptoCompareService);
        httpService = module.get<HttpService>(HttpService);
    });

    it('should be defined', async () => {
        expect(service).toBeDefined();
        expect(service.symbols).toStrictEqual(['BTC', 'ETH']);
        expect(service.currencies).toStrictEqual(['USD', 'GBP']);
    });

    it('should send subscribe message to cc stream when connected cc websocket', async (done) => {
        const wsServerNew = new WebSocket.Server({ port: 4321, noServer: true });

        wsServerNew.on('connection', (client) => {
            client.on('message', function message(msg) {
                const expectedServerSubscribe = ccApiOutSamples.subscribeMsgString;
                expect(msg).toBe(expectedServerSubscribe);
                done(wsServerNew.close());
            });
        });

        const wsModule: TestingModule = await compileModule('ws://localhost:4321');
        const wsService = wsModule.get<CryptoCompareService>(CryptoCompareService);
        expect(wsService).toBeDefined();
    });

    it('should receive quote message and emit quote event', async (done) => {
        const wsServerNew = new WebSocket.Server({ port: 5678, noServer: true });

        wsServerNew.on('connection', (client) => {
            client.on('message', function message() {
                client.send(JSON.stringify(ccApiOutSamples.wsQuoteMessage));
            });
        });

        const wsModule: TestingModule = await compileModule('ws://localhost:5678');
        const eventEmitter = wsModule.get<EventEmitter2>(EventEmitter2);
        eventEmitter.onAny((event) => {
            expect(event).toBe('quote');
        });

        eventEmitter.on('quote', (message) => {
            expect(message.symbol).toBe('BTC');
            expect(message.currency).toBe('USD');
            expect(message.price).toBe(10000);
            done(wsServerNew.close());
        });
    });

    it('should GET a single quote for BTC-USD', async () => {
        const result: AxiosResponse = {
            data: ccApiOutSamples.singleQuote,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        };
        jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));

        const response = await service.getPricePair('BTC', 'USD');
        expect(response.currency).toBe('USD');
        expect(response.symbol).toBe('BTC');
        expect(response.price).toBe(9999.99);
    });

    it('should get multiple crypto, currency pair quotes.', async () => {
        const result: AxiosResponse = {
            data: ccApiOutSamples.multipleQuotes,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        };
        jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));
        const response = await service.getPricePairs(['BTC', 'ETH'], ['USD', 'GBP']);
        expect(response.BTC.USD).toBe(9999.99);
        expect(response.BTC.GBP).toBe(8888.88);
        expect(response.ETH.USD).toBe(7777.77);
        expect(response.ETH.GBP).toBe(6666.66);
    });

    it('should get daily history for pair.', async () => {
        const expected = ccApiOutSamples.historical3Day.Data;
        const result: AxiosResponse = {
            data: ccApiOutSamples.historical3Day,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        };
        jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));
        const response = await service.getDailyHistoryPair('BTC', 'USD', 3);
        expect(response.symbol).toBe('BTC');
        expect(response.currency).toBe('USD');
        expect(response.length).toBe(3);
        expect(response.data.length).toBe(response.length + 1);

        expect(response.data[0].time).toBe(expected[0].time);
        expect(response.data[0].value).toBe(expected[0].close);

        expect(response.data[1].time).toBe(expected[1].time);
        expect(response.data[1].value).toBe(expected[1].close);

        expect(response.data[2].time).toBe(expected[2].time);
        expect(response.data[2].value).toBe(expected[2].close);

        expect(response.data[3].time).toBe(expected[3].time);
        expect(response.data[3].value).toBe(expected[3].close);
    });

    it('should get trading signals for symbol.', async () => {
        const expected = ccApiOutSamples.tradingSignals.Data;
        const result: AxiosResponse = {
            data: ccApiOutSamples.tradingSignals,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        };
        jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));
        const response = await service.getTradingSignal('BTC');
        expect(response.symbol).toBe('BTC');
        expect(response.time).toBe(1620086400);
        expect(response.signals.length).toBe(4);

        expect(response.signals[0].name).toBe('inOutVar');
        expect(response.signals[0].score).toBe(expected.inOutVar.score);
        expect(response.signals[0].sentiment).toBe(expected.inOutVar.sentiment);

        expect(response.signals[1].name).toBe('largetxsVar');
        expect(response.signals[1].score).toBe(expected.largetxsVar.score);
        expect(response.signals[1].sentiment).toBe(expected.largetxsVar.sentiment);

        expect(response.signals[2].name).toBe('addressesNetGrowth');
        expect(response.signals[2].score).toBe(expected.addressesNetGrowth.score);
        expect(response.signals[2].sentiment).toBe(expected.addressesNetGrowth.sentiment);

        expect(response.signals[3].name).toBe('concentrationVar');
        expect(response.signals[3].score).toBe(expected.concentrationVar.score);
        expect(response.signals[3].sentiment).toBe(expected.concentrationVar.sentiment);
    });
});
