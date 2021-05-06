import { HttpService, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AxiosResponse } from 'axios';
import * as WebSocket from 'ws';
import { SymbolHistory, SymbolHistoryDataPoint, SymbolPrice, SymbolSignals } from './crypto-compare.interface';

/**
 * This class manages the API calls and the websocket stream for http://www.cryptocompare.com
 */
@Injectable()
export class CryptoCompareService {
    private logger: Logger = new Logger('CryptoCompareService');
    private ccApiKey: string; // API key for CryptoCompare
    private ccBaseRestApiUrl: string; // CryptoCompare base URL
    private ccWebsocketUrl: string; // CryptoCompare Websocket URL
    private ccStreamer: WebSocket; // CryptoCompare Websocket
    private ccRequestHeaders: Record<string, unknown>; // HTTP header for CryptoCompare API request

    symbols: string[]; // Crypto symbols for the Websocket stream
    currencies: string[]; // Crypto currencies for the Websocket stream
    socketId: string; // The Websocket Client ID opened with CryptoCompare

    constructor(
        private configService: ConfigService,
        private httpService: HttpService,
        private eventEmitter: EventEmitter2
    ) {
        this.ccApiKey = configService.get<string>('BCB_API_KEY', undefined);
        this.ccBaseRestApiUrl = configService.get<string>('BCB_BASE_REST_URL');
        this.ccWebsocketUrl = configService.get<string>('BCB_WEBSOCKET_URL');

        const defaultSymbols = configService.get<string>('BCB_DEFAULT_PAIRS', 'BTC');
        this.symbols = defaultSymbols.split(',');

        const defaultCurrencies = configService.get<string>('BCB_DEFAULT_CURRENCIES', 'USD');
        this.currencies = defaultCurrencies.split(',');

        this.ccRequestHeaders = {
            'Content-Type': 'application/json',
            Authorization: `ApiKey ${this.ccApiKey}`
        };

        this.connectWs();
    }

    /**
     * Connect to crypto compare websocket service;
     */
    connectWs(): any {
        const ccWsUrl = `${this.ccWebsocketUrl}?api_key=${this.ccApiKey}`;
        this.ccStreamer = new WebSocket(ccWsUrl);
        this._registerEvents();
    }

    /**
     * Get the price for a single pair
     * @param { string } _symbol  The symbol symbol for the coin
     * @param { string } _currency  The currency symbol for the value
     * @returns Promise<Array<SymbolPrice>>
     */
    async getPricePair(_symbol: string, _currency: string): Promise<SymbolPrice> {
        try {
            return this.getPricePairs([_symbol], [_currency]).then((price) => {
                const amounts: any = price[_symbol];
                const symbolQuote: SymbolPrice = {
                    symbol: _symbol,
                    currency: _currency,
                    price: parseFloat(amounts[_currency])
                };
                return symbolQuote;
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Get the price for multiple pairs and currencies
     * @param { string[] } _symbols An array of crypto symbols i.e. ['BTC', 'ETH']
     * @param { string[] } _currencies An array of currency symbols i.e. ['USD', 'ZAR']
     * @returns Promise of the response data in as json
     */
    async getPricePairs(_symbols: string[], _currencies: string[]): Promise<any> {
        const symbols: string = _symbols ? _symbols.join(',') : this.symbols.join(',');
        const currencies: string = _currencies ? _currencies.join(',') : this.currencies.join(',');
        const requestUrl = `${this.ccBaseRestApiUrl}/pricemulti?e=CCCAGG&fsyms=${symbols}&tsyms=${currencies}`;
        const response: AxiosResponse<any> = await this.httpService
            .get(requestUrl, { headers: this.ccRequestHeaders })
            .toPromise();
        return response.data;
    }

    /**
     * Get daily history for a pair
     * @param { string } symbol The Crypto symbol i.e. BTC
     * @param { string } currency The Crypto fiat currency symbol i.e. USD
     * @param { number } length The duration in days default is 7 i.e. 7 days
     * @returns { Promise<SymbolHistory> } The closing daily history for a pair
     */
    async getDailyHistoryPair(symbol: string, currency: string, length?: number): Promise<SymbolHistory> {
        if (!length) length = 7; // Set length to 7 days default
        const requestUrl = `${this.ccBaseRestApiUrl}/histoday?e=CCCAGG&fsym=${symbol}&tsym=${currency}&limit=${length}`;
        console.log(requestUrl);
        const response: AxiosResponse<any> = await this.httpService
            .get(requestUrl, { headers: this.ccRequestHeaders })
            .toPromise();

        // If a successful response reduce payload for client
        const result: SymbolHistory = {
            symbol: symbol,
            currency: currency,
            length: length,
            data: []
        };
        const apiResponseStatus: string = response.data['Response'] ? response.data['Response'] : 'Failed';

        if (apiResponseStatus === 'Success') {
            const responseData: any[] = response.data.Data || [];
            responseData.forEach((dataPoint) => {
                const historyPoint: SymbolHistoryDataPoint = {
                    time: dataPoint.time,
                    value: dataPoint.close
                };
                result.data.push(historyPoint);
            });
        }
        this.logger.debug(result);
        return result;
    }

    /**
     * Get the latest trading signals
     * Powered by IntoTheBlock, an intelligence company that leverages machine
     * learning and advanced statistics to extract intelligent signals for crypto-assets.
     * @param { string } symbol The Crypto symbol i.e. BTC
     * @returns Promise of the response data in as json
     */
    async getTradingSignal(symbol: string): Promise<SymbolSignals> {
        const requestUrl = `${this.ccBaseRestApiUrl}/tradingsignals/intotheblock/latest?fsym=${symbol}`;
        const response: AxiosResponse<any> = await this.httpService
            .get(requestUrl, { headers: this.ccRequestHeaders })
            .toPromise();

        // If a successful response reduce payload for client
        const result: SymbolSignals = {
            symbol: symbol,
            time: response.data.Data.time,
            signals: []
        };
        const apiResponseStatus: string = response.data['Response'] ? response.data['Response'] : 'Failed';
        if (apiResponseStatus === 'Success') {
            // This momentum signal calculates the net change of in/out of the money addresses,
            // if the number of "In the Money" addresses is increasing this would be a bullish signal.
            // In the money means addresses that would make a profit on the tokens they hold
            // because they acquired the tokens at a lower price.
            if (response.data.Data.inOutVar) {
                const signal: any = response.data.Data.inOutVar;
                result.signals.push({
                    name: 'inOutVar',
                    sentiment: signal.sentiment,
                    score: signal.score
                });
            }

            // Momentum signal that is bullish when the short term
            // trend of the number of txs > $100k is greater than the long term average.
            if (response.data.Data.largetxsVar) {
                const signal: any = response.data.Data.largetxsVar;
                result.signals.push({
                    name: 'largetxsVar',
                    sentiment: signal.sentiment,
                    score: signal.score
                });
            }

            // Momentum signal that gives an indication of the tokens underlying network
            // health by measuring the amount of new addresses minus the addresses that
            // have their balances emptied. It is bullish when more addresses are being
            // created than emptied.
            if (response.data.Data.addressesNetGrowth) {
                const signal: any = response.data.Data.addressesNetGrowth;
                result.signals.push({
                    name: 'addressesNetGrowth',
                    sentiment: signal.sentiment,
                    score: signal.score
                });
            }

            // The Concentration signal is based on the accumulation (bullish) or reduction (bearish)
            // of addresses with more than 0.1% of the circulating supply.
            if (response.data.Data.concentrationVar) {
                const signal: any = response.data.Data.concentrationVar;
                result.signals.push({
                    name: 'concentrationVar',
                    sentiment: signal.sentiment,
                    score: signal.score
                });
            }
        }
        this.logger.debug(result);
        return result;
    }

    /**
     * Subscribe to Crypto Compare Websocket for pairs
     * @param { string[] } _symbols An array for symbol symbols
     * @param { string[] } _currencies An array for currency symbols
     */
    subscribeStream(_symbols: string[], _currencies: string[]): void {
        const subRequest: any = {
            action: 'SubAdd',
            subs: this._createStreamPairArray(_symbols, _currencies)
        };
        this.ccStreamer.send(JSON.stringify(subRequest));
    }

    /**
     * Register the WebSocket events
     */
    private _registerEvents(): void {
        // When connection open subscribe to stream
        this.ccStreamer.on('open', () => {
            this.logger.log('Stream Open');
            this.subscribeStream(this.symbols, this.currencies);
        });

        // When connection open subscribe to stream
        this.ccStreamer.on('error', (error) => {
            this.logger.error(error);
        });

        // When message received to stream reduce quote
        // and emit event
        this.ccStreamer.on('message', (recvMessage: any) => {
            const message: any = JSON.parse(recvMessage.toString());

            if (message.TYPE == 20 && message.MESSAGE === 'STREAMERWELCOME') {
                // When connected get socket id an save
                this.logger.debug(`Welcome SOCKET_ID = ${message.SOCKET_ID}`);
                this.socketId = message.SOCKET_ID;
            } else if (message.TYPE == 999 && message.MESSAGE === 'HEARTBEAT') {
                // When heart beat emit event to show connection is still open
                this.logger.debug(`Heartbeat ${this.socketId}`);
                this.eventEmitter.emit('cc.connection.heartbeat', this.socketId);
            } else if (message.TYPE == 5 && message.MEDIAN) {
                // When aggregated quote received reduce and emit event
                // Since this is not used for trading we can
                // round the price to the nearest integer
                const symbolPrice: SymbolPrice = {
                    symbol: message.FROMSYMBOL,
                    currency: message.TOSYMBOL,
                    price: Math.round(message.MEDIAN)
                };
                this.eventEmitter.emit('quote', symbolPrice);
            } else if (message.TYPE === '500' && message.MESSAGE === 'INVALID_SUB') {
                // If failed to get pair from stream try API call
                this.logger.error(`ERROR - ${message.PARAMETER} : ${message.INFO}`);
                const parameter: string[] = message.PARAMETER.split('~'); //  5~CCCAGG~LTC~ZAR
                this.getPricePair(parameter[2], parameter[3])
                    .then((apiResult: SymbolPrice) => {
                        apiResult.note = '500_NOT_IN_STREAM_INVALID_SUB';
                        apiResult.price = Math.round(apiResult.price);
                        this.logger.debug(apiResult);
                        this.eventEmitter.emit('update.quote', apiResult);
                    })
                    .catch(this.logger.log);
            }
        });
    }

    /**
     * Create stream CryptoCompare Aggregate Index pair array
     * @param { string[] } _symbols An array for symbol symbols
     * @param { string[] } _currencies An array for currency symbols
     * @returns { sting[] } The formatted CC expected pair i.e. 5~CCCAGG~BTC-USD,5~CCCAGG~ETH-USD,
     */
    private _createStreamPairArray(_symbols: string[], _currencies: string[]): string[] {
        const result: string[] = [];
        _symbols.forEach((symbol) => {
            _currencies.forEach((currency) => {
                result.push(`5~CCCAGG~${symbol}~${currency}`);
            });
        });
        return result;
    }
}
