import {utils} from 'ethers';

export const ETHER_NATIVE_TOKEN = {
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'ETH',
  name: 'ether'
};

export const DEFAULT_GAS_PRICE = 10000000000;

export const DEFAULT_GAS_LIMIT = 200000;

export const DEFAULT_GAS_LIMIT_EXECUTION = 80000;

export const GAS_BASE = 60000;

export const EMPTY_DATA = utils.formatBytes32String('0');

export const DEPLOYMENT_REFUND = utils.bigNumberify(570000).div(5).mul(6);

export const ONE_SIGNATURE_GAS_COST = utils.bigNumberify('4420');
