import {utils, Wallet, Contract, providers} from 'ethers';
import WalletContract from '@universal-login/contracts/build/WalletMaster.json';
import {Notification, generateCode, addCodesToNotifications, resolveName, MANAGEMENT_KEY, OPERATION_CALL, calculateMessageHash, waitForContractDeploy, Message, SignedMessage, createSignedMessage, MessageWithFrom, ensureNotNull, PublicRelayerConfig, createKeyPair, CancelAuthorisationRequest, GetAuthorisationRequest, signCancelAuthorisationRequest, signGetAuthorisationRequest, } from '@universal-login/commons';
import AuthorisationsObserver from '../core/observers/AuthorisationsObserver';
import BlockchainObserver from '../core/observers/BlockchainObserver';
import {BalanceObserver} from '../core/observers/BalanceObserver';
import {DeploymentObserver} from '../core/observers/DeploymentObserver';
import MESSAGE_DEFAULTS from '../core/utils/MessageDefaults';
import {RelayerApi} from '../integration/http/RelayerApi';
import {BlockchainService} from '../integration/ethereum/BlockchainService';
import {MissingConfiguration} from '../core/utils/errors';
import {FutureWalletFactory} from './FutureWalletFactory';
import {ExecutionFactory, Execution} from '../core/services/ExecutionFactory';

class UniversalLoginSDK {
  provider: providers.Provider;
  relayerApi: RelayerApi;
  authorisationsObserver: AuthorisationsObserver;
  blockchainObserver: BlockchainObserver;
  executionFactory: ExecutionFactory;
  balanceObserver?: BalanceObserver;
  deploymentObserver?: DeploymentObserver;
  blockchainService: BlockchainService;
  futureWalletFactory?: FutureWalletFactory;
  defaultPaymentOptions: Message;
  config?: PublicRelayerConfig;
  factoryAddress?: string;

  constructor(
    relayerUrl: string,
    providerOrUrl: string | providers.Provider,
    ensAddress?: string,
    paymentOptions?: Message,
  ) {
    this.provider = typeof(providerOrUrl) === 'string' ?
      new providers.JsonRpcProvider(providerOrUrl, {chainId: 0} as any)
      : providerOrUrl;
    this.relayerApi = new RelayerApi(relayerUrl);
    this.authorisationsObserver = new AuthorisationsObserver(this.relayerApi);
    this.executionFactory = new ExecutionFactory(this.relayerApi);
    this.blockchainService = new BlockchainService(this.provider);
    this.blockchainObserver = new BlockchainObserver(this.blockchainService);
    this.defaultPaymentOptions = {...MESSAGE_DEFAULTS, ...paymentOptions};
  }

  async create(ensName: string): Promise<[string, string]> {
    const {publicKey, privateKey} = createKeyPair();
    const result = await this.relayerApi.createWallet(publicKey, ensName);
    const contract = await waitForContractDeploy(
      this.provider,
      WalletContract,
      result.transaction.hash,
    );
    return [privateKey, contract.address];
  }

  async createFutureWallet() {
    await this.getRelayerConfig();
    this.getFutureWalletFactory();
    return this.futureWalletFactory!.createFutureWallet();
  }

  async addKey(
    to: string,
    publicKey: string,
    privateKey: string,
    transactionDetails: Message,
    keyPurpose = MANAGEMENT_KEY,
  ) {
    const key = publicKey;
    const data = new utils.Interface(WalletContract.interface).functions.addKey.encode([key, keyPurpose]);
    const message = {
      ...transactionDetails,
      to,
      from: to,
      data,
    };
    return this.execute(message, privateKey);
  }

  async addKeys(
    to: string,
    publicKeys: string[],
    privateKey: string,
    transactionDetails: SignedMessage,
    keyPurpose = MANAGEMENT_KEY,
  ) {
    const keys = publicKeys.map((publicKey) => publicKey);
    const keyRoles = new Array(publicKeys.length).fill(keyPurpose);
    const data = new utils.Interface(WalletContract.interface).functions.addKeys.encode([keys, keyRoles]);
    const message = {
      ...transactionDetails,
      to,
      from: to,
      data,
    };
    return this.execute(message, privateKey);
  }

  async removeKey(
    to: string,
    address: string,
    privateKey: string,
    transactionDetails: SignedMessage,
  ) {
    const key = address;
    const data = new utils.Interface(WalletContract.interface).functions.removeKey.encode([key, MANAGEMENT_KEY]);
    const message = {
      ...transactionDetails,
      to,
      from: to,
      value: 0,
      data,
      operationType: OPERATION_CALL,
    };
    return this.execute(message, privateKey);
  }

  async setRequiredSignatures(
    to: string,
    requiredSignatures: number,
    privateKey: string,
    transactionDetails: SignedMessage,
  ) {
    const data = new utils.Interface(WalletContract.interface).functions.setRequiredSignatures.encode([requiredSignatures]);
    const message = {
      ...transactionDetails,
      to,
      from: to,
      value: 0,
      data,
      operationType: OPERATION_CALL,
    };
    return this.execute(message, privateKey);
  }

  async getMessageStatus(message: SignedMessage) {
    const messageHash = calculateMessageHash(message);
    return this.relayerApi.getStatus(messageHash);
  }

  async getRelayerConfig() {
    this.config = this.config || (await this.relayerApi.getConfig()).config;
    return this.config;
  }

  async getBalanceObserver() {
    ensureNotNull(this.config, MissingConfiguration);
    this.balanceObserver = this.balanceObserver || new BalanceObserver(this.config!.supportedTokens, this.provider);
  }

  async getDeploymentObserver() {
    ensureNotNull(this.config, MissingConfiguration);
    this.deploymentObserver = this.deploymentObserver || new DeploymentObserver(this.blockchainService, this.config!.contractWhiteList);
  }

  private getFutureWalletFactory() {
    ensureNotNull(this.config, Error, 'Relayer configuration not yet loaded');
    const futureWalletConfig = {
      supportedTokens: this.config!.supportedTokens,
      factoryAddress: this.config!.factoryAddress,
      contractWhiteList: this.config!.contractWhiteList,
      chainSpec: this.config!.chainSpec
    };
    this.futureWalletFactory = this.futureWalletFactory || new FutureWalletFactory(futureWalletConfig, this.provider, this.blockchainService, this.relayerApi);
  }

  async execute(message: Message, privateKey: string): Promise<Execution> {
    const unsignedMessage = {
      ...this.defaultPaymentOptions,
      ...message,
      nonce: message.nonce || parseInt(await this.getNonce(message.from!, privateKey), 10),
    } as MessageWithFrom;
    const signedMessage = createSignedMessage(unsignedMessage, privateKey);
    return this.executionFactory.createExecution(signedMessage);
  }

  async getNonce(walletContractAddress: string, privateKey: string) {
    const wallet = new Wallet(privateKey, this.provider);
    const contract = new Contract(walletContractAddress, WalletContract.interface, wallet);
    return contract.lastNonce();
  }

  async getWalletContractAddress(ensName: string) {
    const walletContractAddress = await this.resolveName(ensName);
    if (walletContractAddress && await this.blockchainService.getCode(walletContractAddress)) {
      return walletContractAddress;
    }
    return null;
  }

  async walletContractExist(ensName: string) {
    const walletContractAddress = await this.getWalletContractAddress(ensName);
    return walletContractAddress !== null;
  }

  async resolveName(ensName: string) {
    await this.getRelayerConfig();
    const {ensAddress} = this.config!.chainSpec;
    return resolveName(this.provider, ensAddress, ensName);
  }

  async connect(walletContractAddress: string) {
    const {publicKey, privateKey} = createKeyPair();
    await this.relayerApi.connect(walletContractAddress, publicKey.toLowerCase());
    return {
      privateKey,
      securityCode: generateCode(publicKey)
    };
  }

  async denyRequest(walletContractAddress: string, publicKey: string, privateKey: string) {
    const cancelAuthorisationRequest: CancelAuthorisationRequest = {
      walletContractAddress,
      publicKey,
      signature: ''
    };
    signCancelAuthorisationRequest(cancelAuthorisationRequest, privateKey);
    await this.relayerApi.denyConnection(cancelAuthorisationRequest);
    return publicKey;
  }

  subscribe(eventType: string, filter: any, callback: Function) {
    if (['KeyAdded', 'KeyRemoved'].includes(eventType)) {
      return this.blockchainObserver.subscribe(eventType, filter, callback);
    }
    throw `Unknown event type: ${eventType}`;
  }

  subscribeAuthorisations(walletContractAddress: string, privateKey: string, callback: Function) {
    const getAuthorisationRequest: GetAuthorisationRequest = {
      walletContractAddress,
      signature: ''
    };
    signGetAuthorisationRequest(getAuthorisationRequest, privateKey);
    return this.authorisationsObserver.subscribe(
      getAuthorisationRequest,
      (notifications: Notification[]) => callback(addCodesToNotifications(notifications))
    );
  }

  async start() {
    await this.blockchainObserver.start();
  }

  stop() {
    this.blockchainObserver.stop();
  }

  async finalizeAndStop() {
    await this.blockchainObserver.finalizeAndStop();
  }
}

export default UniversalLoginSDK;
