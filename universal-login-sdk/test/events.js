import chai, {expect} from 'chai';
import sinonChai from 'sinon-chai';
import EthereumIdentitySDK from 'universal-login-sdk/lib/sdk';
import {RelayerUnderTest} from 'universal-login-relayer';
import {createMockProvider, getWallets, solidity} from 'ethereum-waffle';
import ethers from 'ethers';
import sinon from 'sinon';

chai.use(solidity);
chai.use(sinonChai);

describe('SDK - events', async () => {
  let provider;
  let relayer;
  let sdk;
  let identityAddress;
  let wallet;
  let privateKey;
  let sponsor;

  before(async () => {
    provider = createMockProvider();
    [wallet, sponsor] = await getWallets(provider);
    relayer = await RelayerUnderTest.createPreconfigured(provider);
    await relayer.start();
    ({provider} = relayer);
    sdk = new EthereumIdentitySDK(relayer.url(), provider);
    [privateKey, identityAddress] = await sdk.create('alex.mylogin.eth');
    sponsor.send(identityAddress, 10000);
  });


  it('create, request connection, addKey roundtrip', async () => {
    const connectionCallback = sinon.spy();
    const keyCallback = sinon.spy();

    sdk.start();

    await sdk.subscribe('AuthorisationsChanged', identityAddress, connectionCallback);
    await sdk.subscribe('KeyAdded', identityAddress, keyCallback);

    const secondPrivateKey = await sdk.connect(identityAddress, 'Some label');
    const {address} = new ethers.Wallet(secondPrivateKey);
    await sdk.addKey(identityAddress, wallet.address, privateKey);

    await sdk.finalizeAndStop();
    expect(keyCallback).to.have.been.calledWith({address: wallet.address, keyType: 1, purpose: 1});
    expect(connectionCallback).to.have.been.calledWith(sinon.match([{index: 0, key: address, label: 'Some label'}]));
  });

  after(async () => {
    await relayer.stop();
  });
});
