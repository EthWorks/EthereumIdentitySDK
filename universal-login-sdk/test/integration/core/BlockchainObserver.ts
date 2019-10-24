import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {solidity, createFixtureLoader} from 'ethereum-waffle';
import {Wallet, utils, Contract} from 'ethers';
import basicSDK from '../../fixtures/basicSDK';
import {SdkConfigDefault} from '../../../lib/config/SdkConfigDefault';
import {createWallet} from '../../helpers';
import {RelayerUnderTest} from '@universal-login/relayer';
import UniversalLoginSDK from '../../../lib';
import BlockchainObserver from '../../../lib/core/observers/BlockchainObserver';

chai.use(solidity);
chai.use(sinonChai);

const loadFixture = createFixtureLoader();

describe('INT: BlockchainObserver', async () => {
  let relayer: RelayerUnderTest;
  let sdk: UniversalLoginSDK;
  let blockchainObserver: BlockchainObserver;
  let privateKey: string;
  let contractAddress: string;
  let wallet: Wallet;
  let otherWallet: Wallet;
  let otherWallet2: Wallet;
  let mockToken: Contract;

  beforeEach(async () => {
    ({relayer, sdk, mockToken, contractAddress, wallet, otherWallet, otherWallet2, privateKey} = await loadFixture(basicSDK));
    ({blockchainObserver} = sdk);
    (blockchainObserver as any).lastBlock = 0;
  });

  afterEach(async () => {
    await relayer.clearDatabase();
  });

  it('subscribe: should emit AddKey on construction', async () => {
    ({contractAddress, privateKey} = await createWallet('me.mylogin.eth', sdk, wallet));
    await mockToken.transfer(contractAddress, utils.parseEther('20'));
    const {address} = new Wallet(privateKey);
    const callback = sinon.spy();
    const filter = {contractAddress, key: address};
    await blockchainObserver.subscribe('KeyAdded', filter, callback);
    await blockchainObserver.fetchEvents();
    expect(callback).to.have.been.calledWith({key: address});
  });

  it('subscribe: should emit AddKey on addKey', async () => {
    const callback = sinon.spy();
    const paymentOptions = {...SdkConfigDefault.paymentOptions, gasToken: mockToken.address};
    const filter = {contractAddress, key: wallet.address};
    await blockchainObserver.subscribe('KeyAdded', filter, callback);
    const execution = await sdk.addKey(contractAddress, wallet.address, privateKey, paymentOptions);
    await execution.waitToBeSuccess();
    await blockchainObserver.fetchEvents();
    expect(callback).to.have.been.calledWith({key: wallet.address});
  });

  it('subscribe: shouldn`t emit AddKey on add another key', async () => {
    const callback = sinon.spy();
    const callback2 = sinon.spy();
    const paymentOptions = {...SdkConfigDefault.paymentOptions, gasToken: mockToken.address};

    const filter = {contractAddress, key: otherWallet.address};
    const filter2 = {contractAddress, key: otherWallet2.address};
    await blockchainObserver.subscribe('KeyAdded', filter, callback);
    await blockchainObserver.subscribe('KeyAdded', filter2, callback2);

    const execution = await sdk.addKey(contractAddress, otherWallet.address, privateKey, paymentOptions);
    await execution.waitToBeSuccess();
    await blockchainObserver.fetchEvents();

    expect(callback).to.have.been.calledWith({key: otherWallet.address});
    expect(callback2).to.not.have.been.called;
  });

  it('subscribe: should emit RemoveKey on removeKey', async () => {
    const callback = sinon.spy();
    const paymentOptions = {...SdkConfigDefault.paymentOptions, gasToken: mockToken.address};
    const execution = await sdk.addKey(contractAddress, wallet.address, privateKey, paymentOptions);
    await execution.waitToBeSuccess();
    const filter = {contractAddress, key: wallet.address};
    await blockchainObserver.subscribe('KeyRemoved', filter, callback);
    const removeKeyPaymentOption = {...SdkConfigDefault.paymentOptions, gasToken: mockToken.address};
    const {waitToBeSuccess} = await sdk.removeKey(contractAddress, wallet.address, privateKey, removeKeyPaymentOption);
    await waitToBeSuccess();
    await blockchainObserver.fetchEvents();
    expect(callback).to.have.been.calledWith({key: wallet.address});
  });

  after(async () => {
    await relayer.stop();
    sdk.stop();
  });
});
