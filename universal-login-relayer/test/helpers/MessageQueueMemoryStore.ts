import {SignedMessage, calculateMessageHash} from '@universal-login/commons';
import {IMessageQueueStore} from '../../lib/core/services/messages/IMessageQueueStore';
import {QueueItem} from '../../lib/core/models/messages/QueueItem';

export default class MessageQueueMemoryStore implements IMessageQueueStore {
  public queueItems: QueueItem[];

  constructor() {
    this.queueItems = [];
  }

  async add(signedMessage: SignedMessage) {
    const hash = calculateMessageHash(signedMessage);
    this.queueItems.push({
      hash
    });
    return hash;
  }

  async getNext() {
    return this.queueItems[0];
  }

  async remove(hash: string) {
    this.queueItems.splice(this.findIndex(hash), 1);
  }

  private findIndex(hash: string) {
    return this.queueItems.findIndex((messageEntity: QueueItem) => messageEntity.hash === hash);
  }
}
