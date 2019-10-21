import {DEFAULT_GAS_PRICE, DEFAULT_GAS_LIMIT, ETHER_NATIVE_TOKEN, Message} from '@universal-login/commons';

export const transactionDetails: Partial<Message> = {
  gasPrice: DEFAULT_GAS_PRICE,
  gasLimit: DEFAULT_GAS_LIMIT,
  gasToken: ETHER_NATIVE_TOKEN.address,
};
