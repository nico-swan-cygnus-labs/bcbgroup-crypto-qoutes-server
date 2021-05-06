export interface SymbolPrice {
    // The crypto symbol
    symbol: string;
    // The fiat currency symbol
    currency: string;
    // The value for the crypto coin
    price: number;
    // Extra information such as the price isn't live in a stream
    note?: string;
}

export interface SymbolHistory {
    // The crypto symbol
    symbol: string;
    // The fiat currency symbol
    currency: string;
    // The number of data points
    length: number;
    // The data points
    data: SymbolHistoryDataPoint[];
}

export interface SymbolHistoryDataPoint {
    // The Epoch unix timestamp
    time: string;
    // The Value
    value: string;
}

export interface SymbolSignals {
    // The crypto symbol
    symbol: string;
    // The Epoch unix timestamp
    time: number;
    // Signals;
    signals: TradingSignals[];
}

export interface TradingSignals {
    // The name of the signal
    // inOutVar - This momentum signal calculates the net change of in/out of the money addresses, if the number of "In the Money" addresses is increasing this would be a bullish signal. In the money means addresses that would make a profit on the tokens they hold because they acquired the tokens at a lower price.
    // largetxsVar - Momentum signal that is bullish when the short term trend of the number of txs > $100k is greater than the long term average.
    // addressesNetGrowth - Momentum signal that gives an indication of the tokens underlying network health by measuring the amount of new addresses minus the addresses that have their balances emptied. It is bullish when more addresses are being created than emptied.
    // concentrationVar - The Concentration signal is based on the accumulation (bullish) or reduction (bearish) of addresses with more than 0.1% of the circulating supply.
    name: string;

    // Latest sentiment for the asset, either bullish, bearish or neutral.
    sentiment: string;

    // Score is a number between 0 and 1 that normalises ‘value’ based on bullish and bearish thresholds which are defined for each signal and asset.
    score: number;
}
