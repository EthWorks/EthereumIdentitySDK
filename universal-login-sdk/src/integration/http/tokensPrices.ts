import {ObservedCurrency, TokensPrices, http as _http, TokenDetails, ETHER_NATIVE_TOKEN} from '@unilogin/commons';
const cryptocompare = require('cryptocompare');
import {fetch} from './fetch';

interface TokenDetailsWithCoingeckoId extends TokenDetails {
  coingeckoId: string;
};

const fetchTokenInfo = (tokenDetails: TokenDetailsWithCoingeckoId[], currencies: ObservedCurrency[]) => {
  const http = _http(fetch)('https://api.coingecko.com/api/v3');
  const query = `ids=${tokenDetails.map(token => token.coingeckoId).join(',')}&vs_currencies=${currencies.join(',')}`;
  console.log(query);
  return http('GET', `/simple/price?${query}`);
};

const getCoingeckoId = (tokenName: string) => {
  if (tokenName === ETHER_NATIVE_TOKEN.name) {
    return 'ethereum';
  } else if (tokenName === 'Dai Stablecoin') {
    return 'dai';
  }
  return tokenName.split(' ').join('-').toLowerCase();
};

export async function getPrices(fromTokens: TokenDetails[], toTokens: ObservedCurrency[]): Promise<TokensPrices> {
  const tokenDetailsWithCoingeckoId = fromTokens.map(token => ({...token, coingeckoId: getCoingeckoId(token.name)}));
  const pricesWithCoingeckoId = await fetchTokenInfo(tokenDetailsWithCoingeckoId, ['ETH', 'USD']);
  const prices: TokensPrices = {};
  tokenDetailsWithCoingeckoId.map(token => {
    prices[token.symbol] = {} as Record<ObservedCurrency, number>;
    const keys = Object.keys(pricesWithCoingeckoId[token.coingeckoId]);
    keys.map(key => {
      prices[token.symbol] = {...prices[token.symbol], [key.toUpperCase()]: pricesWithCoingeckoId[token.coingeckoId][key]};
    });
  });
  Object.keys(prices).map(key => key.toUpperCase());
  return prices;
}

export const getEtherPriceInCurrency = async (currency: 'USD' | 'EUR' | 'GBP'): Promise<string> => {
  const priceInCurrency = await cryptocompare.price('ETH', currency);
  return priceInCurrency[currency];
};