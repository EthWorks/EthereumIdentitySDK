import {BlockchainService} from '@universal-login/contracts';
import {WalletEventCallback, WalletEventFilter, WalletEventType} from '../models/events';
import {WalletEventsObserver} from './WalletEventsObserver';
import {ensureNotNull, Nullable} from '@universal-login/commons';
import {InvalidObserverState} from '../utils/errors';
import {Callback} from 'reactive-properties/dist/Property';
import {BlockNumberState} from '../states/BlockNumberState';
import {IStorageService} from '../models/IStorageService';
import {StorageEntry} from '../services/StorageEntry';
import {MemoryStorageService} from '../services/MemoryStorageService';
import {asNumber} from '@restless/sanitizers';

const STORAGE_KEY = 'LAST_BLOCK_NUMBER';

class WalletEventsObserverFactory {
  protected observers: Record<string, WalletEventsObserver> = {};
  private unsubscribe: Nullable<Callback> = null;
  private blockNumberStorage: StorageEntry<number>;

  constructor(
    private blockchainService: BlockchainService,
    private currentBlock: BlockNumberState,
    storageService: IStorageService = new MemoryStorageService(),
  ) {
    this.blockNumberStorage = new StorageEntry(STORAGE_KEY, asNumber, storageService);
  }

  async start() {
    this.currentBlock.set(await this.blockchainService.getBlockNumber());
    if (!this.blockNumberStorage.get()) {
      this.blockNumberStorage.set(this.currentBlock.get());
    }
    this.unsubscribe = this.currentBlock.subscribe(() => this.fetchEvents());
  }

  async fetchEvents() {
    ensureNotNull(this.currentBlock.get(), InvalidObserverState);
    await this.fetchEventsOfTypes(['KeyAdded', 'KeyRemoved', 'AddedOwner', 'RemovedOwner']);
  }

  async fetchEventsOfTypes(types: WalletEventType[]) {
    ensureNotNull(this.currentBlock.get(), InvalidObserverState);
    const currentBlockNumber = this.currentBlock.get();
    const storageBlockNumber = this.blockNumberStorage.get();
    ensureNotNull(this.unsubscribe, Error, 'WalletEventsObserverFactory is not started');
    ensureNotNull(storageBlockNumber, Error, 'Missing storageBlockNumber');
    if (currentBlockNumber === storageBlockNumber) {
      return;
    }
    this.blockNumberStorage.set(currentBlockNumber);
    for (const contractAddress of Object.keys(this.observers)) {
      await this.observers[contractAddress].fetchEvents(currentBlockNumber, types);
    }
  }

  subscribe(eventType: WalletEventType, filter: WalletEventFilter, callback: WalletEventCallback) {
    this.observers[filter.contractAddress] = this.observers[filter.contractAddress] || new WalletEventsObserver(filter.contractAddress, this.blockchainService);
    const observableRecord = {key: filter.key, callback};
    return this.observers[filter.contractAddress].subscribe(eventType, observableRecord);
  }

  stop() {
    ensureNotNull(this.unsubscribe, InvalidObserverState);
    this.unsubscribe();
    this.unsubscribe = null;
  }

  async finalizeAndStop() {
    this.stop();
  }
}

export default WalletEventsObserverFactory;
