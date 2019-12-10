import {utils, constants} from 'ethers';
import {ETHER_NATIVE_TOKEN} from './constants';

export const TEST_ACCOUNT_ADDRESS = '0x0000000000000000000000000000000000000001';

export const TEST_CONTRACT_ADDRESS = '0xd9822CF2a4C3AccD2AF175A5dF0376D46Dcb848d';

export const TEST_PRIVATE_KEY = '0x63f01680950dc70f2eb8f373de0c360fcbb89ef437f2f6f2f0a1797979e490a4';

export const TEST_MESSAGE_HASH = '0x06c81cd35a49c66824bc0b84bff850d1a2a56a09260c6fd332ee22a8b15fc9ca';

export const TEST_TRANSACTION_HASH = '0x06c81cd35a49c66824bc0b84bff850d1a2a56a09260c6fd332ee22a8b15fc9ca';

export const TEST_SIGNATURE_KEY_PAIRS = [{
  key: '0xD1D84F0e28D6fedF03c73151f98dF95139700aa7',
  signature: '0x97a061e4965a13cda63e18cf4786ef174d04407dbede36982194b2316717afdd5737a0f24458f2798419dcbf6fc3198598c12693db80149ddc9846a7f17b747f1c',
}, {
  key: '0x8221157B2423906FFbb5FaF2A6B062C3d3A6050f',
  signature: '0xf65bc65a5043e6582b38aa2269bafd759fcdfe32a3640a3b2b9086260c5f090306bb9b821eb5e452748687c69b13f3cb67b74fb1f49b45fbe60b0c90b73a73651b',
}];

export const testJsonRpcUrl = 'http://localhost:8545';

export const TEST_GAS_PRICE = '1';

export const TEST_GAS_LIMIT = 200000;

export const TEST_EXECUTION_OPTIONS = {gasPrice: TEST_GAS_PRICE, gasLimit: TEST_GAS_LIMIT, gasToken: constants.AddressZero};

export const TEST_APPLICATION_INFO = {
  applicationName: 'UniversalLogin',
  logo: 'logo',
  type: 'laptop',
};

export const TEST_DEVICE_INFO = {
  ...TEST_APPLICATION_INFO,
  os: 'Mac',
  platform: 'laptop',
  city: 'Warsaw, Poland',
  ipAddress: '84.10.249.134',
  time: '18 minutes ago',
  browser: 'Safari',
};

export const TEST_TOKEN_ADDRESS = '0x490932174cc4B7a0f546924a070D151D156095f0';

export const TEST_SAI_TOKEN_ADDRESS = '0x05b954633faf5ceeecdf945c13ad825faabbf66f';

export const TEST_TOKEN_DETAILS = [
  {
    address: TEST_TOKEN_ADDRESS,
    symbol: 'DAI',
    name: 'MockDAIToken',
  },
  {
    address: TEST_SAI_TOKEN_ADDRESS,
    symbol: 'SAI',
    name: 'MockSAIToken',
  },
  ETHER_NATIVE_TOKEN,
];

export const TEST_GAS_MODES = [{
  name: 'cheap',
  usdAmount: '0.0000367702',
  gasOptions: [{
    gasPrice: utils.bigNumberify('20000000000'),
    token: TEST_TOKEN_DETAILS[0],
  },
  {
    gasPrice: utils.bigNumberify('20000000000'),
    token: TEST_TOKEN_DETAILS[1],
  },
  {
    gasPrice: utils.bigNumberify('20000000000'),
    token: TEST_TOKEN_DETAILS[2],
  }],
},
{
  name: 'fast',
  usdAmount: '0.00004412424',
  gasOptions: [{
    gasPrice: utils.bigNumberify('24000000000'),
    token: TEST_TOKEN_DETAILS[0],
  },
  {
    gasPrice: utils.bigNumberify('24000000000'),
    token: TEST_TOKEN_DETAILS[1],
  },
  {
    gasPrice: utils.bigNumberify('24000000000'),
    token: TEST_TOKEN_DETAILS[2],
  }],
}];

export const TEST_SDK_CONFIG = {
  authorizationsObserverTick: 3,
  balanceObserverTick: 3,
  priceObserverTick: 3,
  mineableFactoryTick: 3,
  mineableFactoryTimeout: 1000,
};
