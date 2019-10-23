import {expect} from 'chai';
import sinon, {SinonStub} from 'sinon';
import {utils} from 'ethers';
import {TEST_ACCOUNT_ADDRESS, TEST_TRANSACTION_HASH, calculateMessageHash, SignedMessage, MessageStatus, TEST_PRIVATE_KEY} from '@universal-login/commons';
import {messageToSignedMessage, emptyMessage} from '@universal-login/contracts';
import {ExecutionFactory} from '../../../lib/core/services/ExecutionFactory';
import {RelayerApi} from '../../../lib/integration/http/RelayerApi';

describe('UNIT: ExecutionFactory', async () => {
  let executionFactory: ExecutionFactory;
  let relayerApi: RelayerApi;
  let signedMessage: SignedMessage;
  let defaultStatus: MessageStatus;
  let status: MessageStatus;
  const getStatus: SinonStub = sinon.stub().returns({status: {}});
  const execute: SinonStub = sinon.stub();

  before(async () => {
    signedMessage = messageToSignedMessage({...emptyMessage, from: TEST_ACCOUNT_ADDRESS, value: utils.parseEther('3'), to: TEST_ACCOUNT_ADDRESS}, TEST_PRIVATE_KEY);
    const messageHash = await calculateMessageHash(signedMessage);
    defaultStatus = {
      transactionHash: TEST_TRANSACTION_HASH,
      required: 1,
      totalCollected: 1,
      state: 'AwaitSignature',
      messageHash,
      collectedSignatures: [signedMessage.signature],
    };
    relayerApi = {
      execute,
      getStatus,
    } as any;
    executionFactory = new ExecutionFactory(relayerApi, 10);
  });

  beforeEach(() => {
    status = {...defaultStatus};
    getStatus.onCall(1).returns(status);
    execute.returns({status: {...defaultStatus}});
  });

  describe('waitToBeMined', async () => {
    it('waitToBeMined success', async () => {
      status.state = 'Success';
      const execution = await executionFactory.createExecution(signedMessage);
      const messageStatus = await execution.waitToBeSuccess();
      expect(messageStatus).to.be.deep.eq(status);
      expect(getStatus.callCount).be.eq(2);
    });

    it('error', async () => {
      status.state = 'Error';
      status.error = 'Error: waitToBeMined';

      const execution = await executionFactory.createExecution(signedMessage);
      expect(execution.messageStatus).to.be.deep.eq(defaultStatus);
      await expect(execution.waitToBeSuccess()).to.be.rejectedWith('Error: waitToBeMined');
      expect(getStatus.callCount).be.eq(2);
    });

    it('message with no enough signatures', async () => {
      status.state = 'AwaitSignature';
      status.required = 2;
      delete status.transactionHash;

      execute.returns({status});
      const execution = await executionFactory.createExecution(signedMessage);
      expect(await execution.waitToBeSuccess()).to.be.deep.eq(status);
      expect(getStatus.callCount).be.eq(0);
    });
  });

  describe('waitForTransactionHash', () => {
    it('state: Pending', async () => {
      status.state = 'Pending';

      const {waitForTransactionHash} = await executionFactory.createExecution(signedMessage);
      const messageStatus = await waitForTransactionHash();
      expect(messageStatus).to.be.deep.eq(status);
      expect(getStatus.callCount).be.eq(2);
    });

    it('state: Success', async () => {
      status.state = 'Success';

      const {waitForTransactionHash} = await executionFactory.createExecution(signedMessage);
      const messageStatus = await waitForTransactionHash();
      expect(messageStatus).to.be.deep.eq(status);
      expect(getStatus.callCount).be.eq(2);
    });

    it('state: Error', async () => {
      status.state = 'Error';
      status.error = 'Error: waitToBeMined';

      const execution = await executionFactory.createExecution(signedMessage);
      expect(execution.messageStatus).to.be.deep.eq(defaultStatus);
      const messageStatus = await execution.waitForTransactionHash();
      expect(messageStatus).to.be.deep.eq(status);
      expect(getStatus.callCount).be.eq(2);
    });
  });

  afterEach(() => {
    getStatus.resetHistory();
  });
});
