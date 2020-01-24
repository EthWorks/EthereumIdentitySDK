import {TEST_CONTRACT_ADDRESS, TEST_KEY} from '@universal-login/commons';
import {BlockchainService} from '@universal-login/contracts';
import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import WalletEventsObserverFactory from '../../../src/core/observers/WalletEventsObserverFactory';
import {keyAddedEvent, keyRemovedEvent} from '../../helpers/constants';
import {waitExpect} from '@universal-login/commons/testutils';
import {BlockNumberState} from '../../../src/core/states/BlockNumberState';
import {IStorageService} from '../../../src';

chai.use(sinonChai);

const filter = {
  contractAddress: TEST_CONTRACT_ADDRESS,
  key: TEST_KEY,
};

describe('UNIT: WalletEventsObserverFactory', async () => {
  let onKeyAdd: ReturnType<typeof sinon.spy>;
  let onKeyRemove: ReturnType<typeof sinon.spy>;
  let factory: WalletEventsObserverFactory;
  let blockchainService: BlockchainService;
  let blockNumberState: BlockNumberState;
  let storageService: IStorageService;

  beforeEach(async () => {
    blockchainService = {
      getBlockNumber: sinon.fake.resolves(1),
    } as any;
    blockNumberState = {
      get: sinon.fake.returns(1),
      set: sinon.fake(),
      subscribe: sinon.fake.returns(() => {}),
    } as any;
    storageService = {
      get: sinon.fake.returns(0),
      set: sinon.fake(),
    } as any;

    factory = new WalletEventsObserverFactory(blockchainService, blockNumberState, storageService);
    onKeyAdd = sinon.spy();
    onKeyRemove = sinon.spy();
    await factory.start();
  });

  afterEach(async () => {
    factory.stop();
  });

  describe('fetchEventsOfType', () => {
    describe('KeyAdded', () => {
      it('callback is called', async () => {
        blockchainService.getLogs = sinon.fake.resolves([keyAddedEvent]);
        factory.subscribe('KeyAdded', filter, onKeyAdd);
        sinon.replace(blockNumberState, 'get', sinon.fake.returns(2));
        await factory.fetchEventsOfTypes(['KeyAdded']);
        expect(onKeyAdd).to.have.been.calledOnce;
      });

      it('callback does not called', async () => {
        blockchainService.getLogs = sinon.fake.resolves([keyAddedEvent]);
        factory.subscribe('KeyAdded', filter, onKeyAdd);
        await factory.fetchEventsOfTypes(['KeyAdded']);
        expect(onKeyAdd).to.not.have.been.called;
      });
    });

    describe('KeyRemoved', () => {
      it('callback is called', async () => {
        blockchainService.getLogs = sinon.fake.resolves([keyRemovedEvent]);
        factory.subscribe('KeyRemoved', filter, onKeyRemove);
        sinon.replace(blockNumberState, 'get', sinon.fake.returns(2));
        await factory.fetchEventsOfTypes(['KeyRemoved']);
        expect(onKeyRemove).to.have.been.calledOnce;
      });

      it('callback does not called', async () => {
        blockchainService.getLogs = sinon.fake.resolves([keyRemovedEvent]);
        factory.subscribe('KeyRemoved', filter, onKeyRemove);
        await factory.fetchEventsOfTypes(['KeyRemoved']);
        expect(onKeyRemove).to.not.have.been.called;
      });
    });
  });

  describe('subscribe', () => {
    let onKeyAdd2: ReturnType<typeof sinon.spy>;

    beforeEach(() => {
      onKeyAdd2 = sinon.spy();
      blockchainService.getLogs = async (filter) => filter.topics?.includes('0x654abba5d3170185ed25c9b41f7d2094db3643986b05e9e9cab37028b800ad7e') ? [keyAddedEvent] : [];
    });

    it('subscribe twice', async () => {
      factory.subscribe('KeyAdded', filter, onKeyAdd);
      factory.subscribe('KeyAdded', filter, onKeyAdd2);
      sinon.replace(blockNumberState, 'get', sinon.fake.returns(2));
      factory.fetchEvents();
      await waitExpect(() => expect(onKeyAdd).to.have.been.calledOnce);
      expect(onKeyAdd).to.have.been.calledOnceWith({key: TEST_KEY});
      expect(onKeyAdd2).to.have.been.calledOnceWith({key: TEST_KEY});
    });

    it('subscribe twice with 1 unsubscribe', async () => {
      factory.subscribe('KeyAdded', filter, onKeyAdd);
      const unsubscribe = factory.subscribe('KeyAdded', filter, onKeyAdd2);
      unsubscribe();
      sinon.replace(blockNumberState, 'get', sinon.fake.returns(2));
      factory.fetchEvents();
      await waitExpect(() => expect(onKeyAdd).to.have.been.calledOnce);
      expect(onKeyAdd).to.have.been.calledOnceWith({key: TEST_KEY});
      expect(onKeyAdd2).to.not.have.been.called;
    });

    it('subscribe twice with 2 unsubscribes', async () => {
      const unsubscribe = factory.subscribe('KeyAdded', filter, onKeyAdd);
      const unsubscribe2 = factory.subscribe('KeyAdded', filter, onKeyAdd2);
      sinon.replace(blockNumberState, 'get', sinon.fake.returns(2));
      unsubscribe();
      unsubscribe2();
      expect(onKeyAdd).to.not.have.been.called;
      expect(onKeyAdd2).to.not.have.been.called;
    });
  });
});
