# BCB Group crypto quotes server

<div align="center">
  <h1>BCB Assignment</h1>
  <p>This is the server for the crypto quotes assignment</p>
  <br>
  <p>The server connects to the Crypto compare API and Websocket. The websocket stream the default crypto coins defined in the environment variables.</p> 
</div>


  There are alow a few other API see the documentation at the endpoint /api when server is started
  * GET quote -- Will get a single pair 
  * GET quotes -- Will get multiple pair in one request
  * GET history -- Only day history on the closing price for a number of days
  * GET trading signals -- Get the current trading sentiment for a coin

## Assignment requirements

Create a real-time crypto prices dashboard client using angular. The dashboards should stream prices for the following  crypto currency coins [BTC,ETH,XRP,LTC,BCH,ETC] and their value in the following currencies [USD,GBP,EUR,JPY,ZAR].

Nice to haves
 * History 
 * Filters

## Environment variables
### Application settings
* BCB_API_PORT=3000
* BCB_WEBSOCKET_PORT=3001
* BCB_HTTP_TIMEOUT=5000
* BCB_HTTP_MAX_REDIRECTS=5

### Defaults
* BCB_DEFAULT_PAIRS=BTC,ETH,XRP,LTC,BCH,ETC
* BCB_DEFAULT_CURRENCIES=USD,GBP,EUR,JPY,ZAR
* #BCB_DEFAULT_PAIRS=BTC
* #BCB_DEFAULT_CURRENCIES=USD

### CryptoCompare API and WebSocket
* BCB_BASE_REST_URL=https://min-api.cryptocompare.com/data
* BCB_API_KEY=<CryptoCompare API key>
* BCB_WEBSOCKET_URL=wss://streamer.cryptocompare.com/v2

 ## Production suggestions

 * Need to complete the negative testing scenarios to ensure the API is stable and get 100% code coverage. 
 * It should reconnect when it was disconnected and there is at least on client connected. 
 * Add a Redis caching solution for Websockets and REST API for performance, perhaps even a persistance solution for historical data. 
 * Some pairs haven't had quotes and need to implement a pulling solution to feed into websocket stream
 * This was a small project but if larger them we need to look ar the file structure
 * Do performance a tress testing to determine production level loads.
 * Spend time on completing the API documentation  


## MIT License

Created by [Nico Swan](mailto://hi@nicoswan.com).
