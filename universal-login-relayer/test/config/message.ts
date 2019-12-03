import {TEST_ACCOUNT_ADDRESS, TEST_PRIVATE_KEY, Message, ACTUAL_NETWORK_VERSION, ACTUAL_WALLET_VERSION} from '@universal-login/commons';
import {messageToSignedMessage, emptyMessage} from '@universal-login/contracts';

export const getTestSignedMessage = (overrides?: Partial<Message>) => {
  const exampleMessage = {...emptyMessage, from: TEST_ACCOUNT_ADDRESS, to: TEST_ACCOUNT_ADDRESS, ...overrides};
  return messageToSignedMessage(exampleMessage, TEST_PRIVATE_KEY, ACTUAL_NETWORK_VERSION, ACTUAL_WALLET_VERSION);
};

export default getTestSignedMessage;
