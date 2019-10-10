import {expect, use} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {calculateMessageHash, waitExpect, SignedMessage, TEST_TRANSACTION_HASH} from '@universal-login/commons';
import ExecutionWorker from '../../../lib/core/services/messages/ExecutionWorker';
import QueueMemoryStore from '../../helpers/QueueMemoryStore';
import getTestSignedMessage from '../../config/message';
import MessageMemoryRepository from '../../helpers/MessageMemoryRepository';
import {createMessageItem} from '../../../lib/core/utils/messages/serialisation';
import IMessageRepository from '../../../lib/core/services/messages/IMessagesRepository';
import MessageExecutor from '../../../lib/integration/ethereum/MessageExecutor';
import DeploymentExecutor from '../../../lib/integration/ethereum/DeploymentExecutor';
import IRepository from '../../../lib/core/services/messages/IRepository';
import MemoryRepository from '../../helpers/MemoryRepository';
import Deployment from '../../../lib/core/models/Deployment';

use(sinonChai);

describe('UNIT: Queue Service', async () => {
  let executionWorker: ExecutionWorker;
  let queueMemoryStore: QueueMemoryStore;
  let messageRepository: IMessageRepository;
  let deploymentRepository: IRepository<Deployment>;
  let messageExecutor: MessageExecutor;
  let deploymentExecutor: DeploymentExecutor;
  const wait = sinon.spy();
  const wallet: any = {
    sendTransaction: sinon.fake.returns({
      hash: TEST_TRANSACTION_HASH,
      wait
    }),
  };
  const messageValidator: any = {
    validate: sinon.fake.returns(true)
  };
  const onTransactionMined = sinon.spy();
  let signedMessage: SignedMessage;
  let messageHash: string;

  beforeEach(async () => {
    queueMemoryStore = new QueueMemoryStore();
    messageRepository = new MessageMemoryRepository();
    deploymentRepository = new MemoryRepository<Deployment>();
    messageExecutor = new MessageExecutor(wallet, messageValidator, messageRepository, onTransactionMined);
    deploymentExecutor = new DeploymentExecutor(deploymentRepository);
    executionWorker = new ExecutionWorker([messageExecutor, deploymentExecutor], queueMemoryStore);
    signedMessage = getTestSignedMessage();
    messageHash = calculateMessageHash(signedMessage);
    await messageRepository.add(
      messageHash,
      createMessageItem(signedMessage)
    );
    sinon.resetHistory();
  });

  it('signedMessage round trip', async () => {
    const executeSpy = sinon.spy(messageExecutor, 'execute');
    executionWorker.start();
    await queueMemoryStore.addMessage(signedMessage);
    await waitExpect(() => expect(executeSpy).to.be.calledOnce);
    expect(wait).to.be.calledAfter(executeSpy);
    expect(onTransactionMined).to.be.calledImmediatelyAfter(wait);
    expect(wait).to.be.calledOnce;
    expect(onTransactionMined).to.be.calledOnce;
  });

  it('should execute pending signedMessage after start', async () => {
    const executeSpy = sinon.spy(messageExecutor, 'execute');
    await queueMemoryStore.addMessage(signedMessage);
    executionWorker.start();
    await waitExpect(() => expect(executeSpy).to.be.calledOnce);
    expect(wait).to.be.calledAfter(executeSpy);
  });

  it('should throw error when hash is null', async () => {
    messageExecutor.execute = sinon.fake.returns(null);
    executionWorker = new ExecutionWorker([messageExecutor, deploymentExecutor], queueMemoryStore);
    executionWorker.start();
    const markAsErrorSpy = sinon.spy(messageRepository.markAsError);
    messageRepository.markAsError = markAsErrorSpy;
    queueMemoryStore.remove = sinon.spy(queueMemoryStore.remove);
    await messageRepository.add(messageHash, createMessageItem(signedMessage));
    messageHash = await queueMemoryStore.addMessage(signedMessage);
    await waitExpect(() => expect(messageRepository.markAsError).calledWith(messageHash, 'TypeError: Cannot read property \'hash\' of null'));
    expect(queueMemoryStore.remove).to.be.calledOnce;
    expect(queueMemoryStore.remove).to.be.calledAfter(markAsErrorSpy);
    expect(onTransactionMined).to.be.not.called;
  });

  it('should not execute if the executor cannot execute, but remove from the queue', async () => {
    messageExecutor.canExecute = sinon.fake.returns(false);
    const executeSpy = sinon.spy(messageExecutor, 'execute');
    executionWorker = new ExecutionWorker([messageExecutor, deploymentExecutor], queueMemoryStore);
    executionWorker.start();
    queueMemoryStore.remove = sinon.spy(queueMemoryStore.remove);
    await messageRepository.add(messageHash, createMessageItem(signedMessage));
    messageHash = await queueMemoryStore.addMessage(signedMessage);

    await waitExpect(() => expect(queueMemoryStore.remove).to.be.calledOnce, 3000);
    expect(messageExecutor.canExecute).to.be.calledOnce;
    expect(executeSpy).to.not.be.called;
  });

  afterEach(async () => {
    await executionWorker.stopLater();
  });
});
