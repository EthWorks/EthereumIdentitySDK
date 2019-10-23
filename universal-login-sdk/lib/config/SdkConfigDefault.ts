import {utils} from 'ethers';
import {ETHER_NATIVE_TOKEN, DEFAULT_GAS_LIMIT, DEFAULT_GAS_PRICE} from '@universal-login/commons';
import {SdkConfig} from './SdkConfig';

export const SdkConfigDefault: SdkConfig = {
  applicationInfo: {
    applicationName: 'Unknown application',
    logo: 'none',
    type: 'unknown',
  },
  paymentOptions: {
    gasToken: ETHER_NATIVE_TOKEN.address,
    gasLimit: utils.bigNumberify(DEFAULT_GAS_LIMIT),
    gasPrice: utils.bigNumberify(DEFAULT_GAS_PRICE),
  },
  observedTokensAddresses: [
    ETHER_NATIVE_TOKEN.address,
  ],
  observedCurrencies: [
    'USD',
    'DAI',
    'ETH',
  ],
  executionFactoryTick: 1000,
  notice: '',
  authorizationsObserverTick: 1000 * 3,
  balanceObserverTick: 1000 * 3,
  priceObserverTick: 1000 * 60 * 5,
};
