import { CacheInterceptor, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CryptoCompareService } from './crypto-compare.service';

@Controller('api')
@UseInterceptors(CacheInterceptor)
export class CryptoCompareController {
    constructor(private readonly cryptoCompareApiService: CryptoCompareService) {}

    @Get('/quote/:symbol/:currency')
    @ApiOperation({
        summary: 'Get a quote for crypto and fiat currency pairs.'
    })
    @ApiParam({ name: 'symbol', description: 'The crypto symbols .i.e. BTC,ETC,XRP' })
    @ApiParam({ name: 'currency', description: 'The currency symbol .i.e. USD,GBP,ZAR' })
    async quote(@Param('symbol') _symbol, @Param('currency') _currency) {
        return await this.cryptoCompareApiService.getPricePair(_symbol, _currency);
    }

    @Get('/quotes')
    @ApiOperation({
        summary: 'Get quotes for a list of crypto and fiat currencies pairs.'
    })
    @ApiQuery({ name: 'symbols', description: 'Comma separated list of crypto symbols .i.e. BTC,ETC,XRP' })
    @ApiQuery({ name: 'currencies', description: 'Comma separated list of currency symbol .i.e. USD,GBP,ZAR' })
    async quotes(@Query('symbols') _symbols, @Query('currencies') _currencies) {
        const symbols: string[] = _symbols ? _symbols.split(',') : undefined;
        const currencies: string[] = _currencies ? _currencies.split(',') : undefined;
        return await this.cryptoCompareApiService.getPricePairs(symbols, currencies);
    }

    @Get('/quotes/history/daily/:symbol/:currency')
    @ApiOperation({
        summary: 'Get daily history for a crypto and fiat currency pair.'
    })
    @ApiParam({ name: 'symbol', description: 'The crypto symbol .i.e. BTC' })
    @ApiParam({ name: 'currency', description: 'The currency symbol .i.e. USD' })
    @ApiQuery({
        name: 'length',
        description: 'The number of days for the history'
    })
    async dailyHistory(@Param('symbol') _symbol, @Param('currency') _currency, @Query('length') _length) {
        const length = _length || 7;
        return await this.cryptoCompareApiService.getDailyHistoryPair(_symbol, _currency, length);
    }

    @Get('/trading/signal/:symbol')
    @ApiOperation({
        summary: 'Get the latest trading signals for a symbol.'
    })
    @ApiParam({ name: 'symbol', description: 'The crypto symbol .i.e. BTC' })
    async tradingSignal(@Param('symbol') _symbol) {
        return await this.cryptoCompareApiService.getTradingSignal(_symbol);
    }
}
