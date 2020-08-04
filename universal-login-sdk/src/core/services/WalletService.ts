import {ensure, ApplicationWallet, walletFromBrain, Procedure, ExecutionOptions, ensureNotFalsy, findGasOption, FAST_GAS_MODE_INDEX, ETHER_NATIVE_TOKEN, waitUntil} from '@unilogin/commons';
import UniLoginSdk from '../../api/sdk';
import {FutureWallet} from '../../api/wallet/FutureWallet';
import {DeployingWallet} from '../../api/wallet/DeployingWallet';
import {InvalidWalletState, InvalidPassphrase, WalletOverridden, TransactionHashNotFound} from '../utils/errors';
import {utils, Wallet} from 'ethers';
import {DeployedWallet, WalletStorage} from '../..';
import {map, State, Property} from 'reactive-properties';
import {WalletState} from '../models/WalletService';
import {IStorageService} from '../models/IStorageService';
import {WalletSerializer} from './WalletSerializer';
import {ConnectingWallet} from '../../api/wallet/ConnectingWallet';
import {NoopStorageService} from './NoopStorageService';
import {WalletStorageService} from './WalletStorageService';
import {RequestedWallet} from '../../api/wallet/RequestedWallet';
import {ConfirmedWallet} from '../../api/wallet/ConfirmedWallet';

type WalletFromBackupCodes = (username: string, password: string) => Promise<Wallet>;

interface WalletStorageWithMigration extends WalletStorage {
  migrate?: () => Promise<void>;
}

export class WalletService {
  private readonly walletSerializer: WalletSerializer;
  private readonly walletStorage: WalletStorageWithMigration;

  private readonly _stateProperty = new State<WalletState>({kind: 'None'});
  readonly stateProperty: Property<WalletState> = this._stateProperty;

  walletDeployed = this.stateProperty.pipe(map((state) => state.kind === 'Deployed'));
  isAuthorized = this.walletDeployed;

  get state() {
    return this.stateProperty.get();
  }

  private setState(state: WalletState) {
    this.saveToStorage(state);
    this._stateProperty.set(state);
  }

  constructor(
    public readonly sdk: UniLoginSdk,
    private readonly walletFromPassphrase: WalletFromBackupCodes = walletFromBrain,
    storageService: IStorageService = new NoopStorageService(),
  ) {
    this.walletStorage = new WalletStorageService(storageService, sdk.config.network);
    this.walletSerializer = new WalletSerializer(sdk);
  }

  getDeployedWallet(): DeployedWallet {
    ensure(this.state.kind === 'Deployed', InvalidWalletState, 'Deployed', this.state.kind);
    return this.state.wallet;
  }

  getFutureWallet() {
    ensure(this.state.kind === 'Future', InvalidWalletState, 'Future', this.state.kind);
    return this.state.wallet;
  }

  private getDeployingWallet(): DeployingWallet {
    ensure(this.state.kind === 'Deploying', InvalidWalletState, 'Deploying', this.state.kind);
    return this.state.wallet;
  }

  getConnectingWallet(): ConnectingWallet {
    ensure(this.state.kind === 'Connecting', InvalidWalletState, 'Connecting', this.state.kind);
    return this.state.wallet;
  }

  getConfirmedWallet(): ConfirmedWallet {
    ensure(this.state.kind === 'Confirmed', InvalidWalletState, 'Confirmed', this.state.kind);
    return this.state.wallet;
  }

  async confirmCode(code: string) {
    ensure(this.state.kind === 'Requested', InvalidWalletState, 'Requested', this.state.kind);
    const {email} = await this.state.wallet.confirmEmail(code);
    if (email === this.state.wallet.email) {
      const confirmedWallet = new ConfirmedWallet(this.state.wallet.email, this.state.wallet.ensName, code);
      this.setConfirmed(confirmedWallet);
      return confirmedWallet;
    }
    return false;
  }

  getRequestedWallet() {
    ensure(this.state.kind === 'Requested', InvalidWalletState, 'Requested', this.state.kind);
    return this.state.wallet;
  }

  getConfirmedWallet() {
    ensure(this.state.kind === 'Confirmed', InvalidWalletState, 'Confirmed', this.state.kind);
    return this.state.wallet;
  }

  async createRequestedWallet(email: string, ensName: string) {
    const requestedWallet = new RequestedWallet(this.sdk, email, ensName);
    this.setRequested(requestedWallet);
    return this.getRequestedWallet().requestEmailConfirmation();
  }

  async createDeployingWallet(name: string): Promise<DeployingWallet> {
    const futureWallet = await this.sdk.createFutureWallet(name, '0', ETHER_NATIVE_TOKEN.address);
    const deployingWallet = await futureWallet.deploy();
    this.setDeploying(deployingWallet);
    return deployingWallet;
  }

  async createFutureWallet(name: string, gasToken = ETHER_NATIVE_TOKEN.address): Promise<FutureWallet> {
    const gasModes = await this.sdk.getGasModes();
    const gasOption = findGasOption(gasModes[FAST_GAS_MODE_INDEX].gasOptions, gasToken);
    const futureWallet = await this.sdk.createFutureWallet(name, gasOption.gasPrice.toString(), gasToken);
    this.setFutureWallet(futureWallet, name);
    return futureWallet;
  }

  async createWallet(name: string, gasToken?: string): Promise<FutureWallet | DeployingWallet> {
    if (this.sdk.isRefundPaid()) {
      return this.createDeployingWallet(name);
    }
    return this.createFutureWallet(name, gasToken);
  }

  async initDeploy() {
    ensure(this.state.kind === 'Future', InvalidWalletState, 'Future', this.state.kind);
    const {wallet: {deploy}} = this.state;
    const deployingWallet = await deploy();
    this.setState({kind: 'Deploying', wallet: deployingWallet});
    return this.getDeployingWallet();
  }

  async waitForTransactionHash() {
    if (this.state.kind === 'Deployed') {
      return this.state.wallet;
    }
    const deployingWallet = this.getDeployingWallet();
    const {transactionHash} = await deployingWallet.waitForTransactionHash();
    ensureNotFalsy(transactionHash, TransactionHashNotFound);
    this.setState({kind: 'Deploying', wallet: deployingWallet, transactionHash});
    return deployingWallet;
  }

  async waitToBeSuccess() {
    if (this.state.kind === 'Deployed') {
      return this.state.wallet;
    }
    const deployingWallet = this.getDeployingWallet();
    const deployedWallet = await deployingWallet.waitToBeSuccess();
    this.setState({kind: 'Deployed', wallet: deployedWallet});
    return deployedWallet;
  }

  async deployFutureWallet() {
    await this.initDeploy();
    await this.waitForTransactionHash();
    return this.waitToBeSuccess();
  }

  setRequested(wallet: RequestedWallet) {
    ensure(this.state.kind === 'None', WalletOverridden);
    this.setState({kind: 'Requested', wallet});
  }

  setConfirmed(wallet: ConfirmedWallet) {
    ensure(this.state.kind === 'Requested', WalletOverridden);
    this.setState({kind: 'Confirmed', wallet});
  }

  setFutureWallet(wallet: FutureWallet, name: string) {
    ensure(this.state.kind === 'None' || this.state.kind === 'Confirmed', WalletOverridden);
    this.setState({kind: 'Future', name, wallet});
  }

  setDeployed() {
    ensure(this.state.kind === 'Future', InvalidWalletState, 'Future', this.state.kind);
    const {name, wallet: {contractAddress, privateKey}} = this.state;
    const wallet = new DeployedWallet(contractAddress, name, privateKey, this.sdk);
    this.setState({kind: 'Deployed', wallet});
  }

  setDeploying(wallet: DeployingWallet) {
    ensure(this.state.kind === 'None', WalletOverridden);
    this.setState({kind: 'Deploying', wallet});
  }

  setConnecting(wallet: ConnectingWallet) {
    ensure(this.state.kind === 'None', WalletOverridden);
    this._stateProperty.set({kind: 'Connecting', wallet});
  }

  setWallet(wallet: ApplicationWallet) {
    ensure(this.state.kind === 'None' || this.state.kind === 'Connecting', WalletOverridden);
    this.setState({
      kind: 'Deployed',
      wallet: new DeployedWallet(wallet.contractAddress, wallet.name, wallet.privateKey, this.sdk),
    });
  }

  async recover(name: string, passphrase: string) {
    const contractAddress = await this.sdk.getWalletContractAddress(name);
    const wallet = await this.walletFromPassphrase(name, passphrase);
    const deployedWallet = new DeployedWallet(contractAddress, name, wallet.privateKey, this.sdk);
    ensure(await deployedWallet.keyExist(wallet.address), InvalidPassphrase);
    this.setWallet(deployedWallet.asApplicationWallet);
  }

  async initializeConnection(name: string): Promise<number[]> {
    const contractAddress = await this.sdk.getWalletContractAddress(name);
    const {privateKey, securityCode} = await this.sdk.connect(contractAddress);
    const connectingWallet: ConnectingWallet = new ConnectingWallet(contractAddress, name, privateKey, this.sdk);
    this.setConnecting(connectingWallet);
    this.setState({kind: 'Connecting', wallet: connectingWallet});
    return securityCode;
  }

  async waitForConnection() {
    if (this.state.kind === 'Deployed') return;
    ensure(this.state.kind === 'Connecting', InvalidWalletState, 'Connecting', this.state.kind);
    const connectingWallet = this.getConnectingWallet();
    const filter = {
      contractAddress: connectingWallet.contractAddress,
      key: connectingWallet.publicKey,
    };
    const addKeyEvent = await this.sdk.walletContractService.getEventNameFor(connectingWallet.contractAddress, 'KeyAdded');
    return new Promise((resolve, reject) => {
      const setWallet = this.setWallet.bind(this);
      const unsubscribe = this.sdk.subscribe(addKeyEvent, filter, () => {
        setWallet(connectingWallet);
        unsubscribe();
        resolve();
      });
      connectingWallet.unsubscribe = unsubscribe;
    });
  }

  async cancelWaitForConnection(tick = 500, timeout = 1500) {
    if (this.state.kind === 'Deployed') return;
    await waitUntil(() => !!this.getConnectingWallet().unsubscribe, tick, timeout);
    this.getConnectingWallet().unsubscribe!();
    this.disconnect();
  }

  async connect(name: string, callback: Procedure) {
    const contractAddress = await this.sdk.getWalletContractAddress(name);
    const {privateKey, securityCode} = await this.sdk.connect(contractAddress);
    const connectingWallet: ConnectingWallet = new ConnectingWallet(contractAddress, name, privateKey, this.sdk);
    this.setConnecting(connectingWallet);
    this.setState({kind: 'Connecting', wallet: connectingWallet});

    const filter = {
      contractAddress,
      key: utils.computeAddress(privateKey),
    };
    const addKeyEvent = await this.sdk.walletContractService.getEventNameFor(connectingWallet.contractAddress, 'KeyAdded');
    const unsubscribe = this.sdk.subscribe(addKeyEvent, filter, () => {
      this.setWallet(connectingWallet);
      unsubscribe;
      callback();
    });

    return {unsubscribe, securityCode};
  }

  async removeWallet(executionOptions: ExecutionOptions) {
    if (this.state.kind !== 'Deployed') {
      this.disconnect();
      return;
    }
    const existingKeysCount = (await this.state.wallet.getKeys()).length;
    if (existingKeysCount > 1) {
      const execution = await this.state.wallet.removeCurrentKey(executionOptions);
      execution.waitToBeSuccess().then(() => this.disconnect());
      return execution;
    }
    this.disconnect();
  }

  disconnect(): void {
    this.setState({kind: 'None'});
  }

  saveToStorage(state: WalletState) {
    const serialized = this.walletSerializer.serialize(state);
    if (serialized !== undefined) {
      this.walletStorage.save(serialized);
    }
  }

  async loadFromStorage() {
    ensure(this.state.kind === 'None', WalletOverridden);
    await this.walletStorage.migrate?.();
    const state = this.walletStorage.load();
    this._stateProperty.set(this.walletSerializer.deserialize(state));
  }

  finalize() {
    this._stateProperty.set({kind: 'None'});
  }

  getRequiredDeploymentBalance() {
    ensure(this.state.kind === 'Future', InvalidWalletState, 'Future', this.state.kind);
    return this.state.wallet.getMinimalAmount();
  }

  isKind(kind: string) {
    return this.state.kind === kind;
  }

  getContractAddress() {
    ensure(this.state.kind !== 'None', InvalidWalletState, 'not None', this.state.kind);
    ensure(this.state.kind !== 'Requested', InvalidWalletState, 'not Requested', this.state.kind);
    ensure(this.state.kind !== 'Confirmed', InvalidWalletState, 'not Confirmed', this.state.kind);
    return this.state.wallet.contractAddress;
  }
}
