import {EventEmitter} from 'fbemitter';
import {loadFixture} from 'ethereum-waffle';
import MessageHandler from '../../lib/core/services/MessageHandler';
import QueueSQLStore from '../../lib/integration/sql/services/QueueSQLStore';
import AuthorisationStore from '../../lib/integration/sql/services/AuthorisationStore';
import basicWalletContractWithMockToken from '../fixtures/basicWalletContractWithMockToken';
import MessageSQLRepository from '../../lib/integration/sql/services/MessageSQLRepository';
import {getContractWhiteList} from '../../lib/http/relayers/RelayerUnderTest';
import {MessageStatusService} from '../../lib/core/services/messages/MessageStatusService';

export default async function setupMessageService(knex) {
  const {wallet, actionKey, provider, mockToken, walletContract, otherWallet} = await loadFixture(basicWalletContractWithMockToken);
  const hooks = new EventEmitter();
  const authorisationStore = new AuthorisationStore(knex);
  const messageRepository = new MessageSQLRepository(knex);
  const queueStore = new QueueSQLStore(knex);
  const statusService = new MessageStatusService(messageRepository, wallet);
  const messageHandler = new MessageHandler(wallet, authorisationStore, hooks, messageRepository, queueStore, getContractWhiteList(), statusService);
  return { wallet, actionKey, provider, mockToken, authorisationStore, messageHandler, walletContract, otherWallet };
}
