import {SignedMessage} from '@universal-login/commons';
import {IMessageQueueStore, MessageEntity} from '../../lib/services/messages/IMessageQueueStore';

export default class MessageQueueMemoryStore implements IMessageQueueStore {
  private counter: number;
  public messageEntries: MessageEntity[];

  constructor() {
    this.counter = 0;
    this.messageEntries = [];
  }

  async add (signedMessage: SignedMessage) {
    this.counter++;
    this.messageEntries.push({
      message: signedMessage,
      id: this.counter.toString(),
      hash: 'hash',
      error: undefined
    });
    return this.counter.toString();
  }

  async getNext () {
    return this.messageEntries[0];
  }

  async get(id: string) {
    return this.messageEntries[0];
  }

  async markAsSuccess (id: string, hash: string) {
    this.messageEntries.pop();
  }

  async markAsError (id: string, error: string) {
    this.messageEntries.pop();
  }
}
