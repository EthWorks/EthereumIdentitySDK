import {Router} from 'express';
import WalletService from '../services/WalletService';
import MessageHandler from '../services/MessageHandler';
import {SignedMessage} from '@universal-login/commons';
import {asyncHandler, sanitize, responseOf, asString, asObject, asNumber, asOptional} from '@restless/restless';
import {asBigNumberish, asOverrideOptions, asArrayish} from '../utils/restlessHelper';

const create = (walletContractService : WalletService) =>
  async (data: {body: {managementKey: string, ensName: string, overrideOptions?: {}}}) => {
    const {managementKey, ensName, overrideOptions} = data.body;
    const transaction = await walletContractService.create(managementKey, ensName, overrideOptions);
    return responseOf({transaction}, 201);
  };

const execution = (messageHandler : MessageHandler) =>
  async (data: {body: SignedMessage}) => {
    const status = await messageHandler.handleMessage(data.body);
    return responseOf({status}, 201);
  };

const getStatus = (messageHandler: MessageHandler) =>
  async (data: {messageHash: string}) => {
    const status = await messageHandler.getStatus(data.messageHash);
    return responseOf(status);
  };

const deploy = (walletContractService: WalletService) =>
  async (data: {body: {publicKey: string, ensName: string,  overrideOptions?: {}}}) => {
    const {publicKey, ensName, overrideOptions} = data.body;
    const trans = await walletContractService.deploy(publicKey, ensName, overrideOptions);
    return responseOf(trans, 201);
  };

export default (walletContractService : WalletService, messageHandler: MessageHandler) => {
  const router = Router();

  router.post('/', asyncHandler(
    sanitize({
      body: asObject({
        managementKey: asString,
        ensName: asString,
        overrideOptions: asOptional(asOverrideOptions)
      })
    }),
    create(walletContractService)
  ));

  router.post('/execution', asyncHandler(
    sanitize({
      body: asObject({
        gasToken: asString,
        operationType: asNumber,
        to: asString,
        from: asString,
        nonce: asString,
        gasLimit: asBigNumberish,
        gasPrice: asBigNumberish,
        data: asArrayish,
        value: asBigNumberish,
        signature: asString
      })
    }),
    execution(messageHandler)
  ));

  router.get('/execution/:messageHash', asyncHandler(
    sanitize({
      messageHash: asString,
    }),
    getStatus(messageHandler)
  ));

  router.post('/deploy', asyncHandler(
    sanitize({
      body: asObject({
        publicKey: asString,
        ensName: asString,
        overrideOptions: asOptional(asOverrideOptions)
      })
    }),
    deploy(walletContractService)
  ));

  return router;
};
