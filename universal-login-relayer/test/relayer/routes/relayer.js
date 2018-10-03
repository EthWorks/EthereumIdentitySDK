import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import {RelayerUnderTest} from '../../../lib/index';
import {createMockProvider, getWallets} from 'ethereum-waffle';
import {waitForContractDeploy, messageSignature} from '../../../lib/utils/utils';
import Identity from 'universal-login-contracts/build/Identity';

chai.use(chaiHttp);
const gasToken = '0x0000000000000000000000000000000000000000';
const gasPrice = 1000000000;
const gasLimit = 1000000;

describe('Relayer - Identity routes', async () => {
  let relayer;
  let provider;
  let wallet;
  let otherWallet;
  let contract;

  before(async () => {
    provider = createMockProvider();
    [wallet, otherWallet] = await getWallets(provider);
    relayer = await RelayerUnderTest.createPreconfigured(provider);
    relayer.start();
  });

  it('Create', async () => {
    const result = await chai.request(relayer.server)
      .post('/identity')
      .send({
        managementKey: wallet.address,
        ensName: 'marek.mylogin.eth'
      });
    const {transaction} = result.body;
    contract = await waitForContractDeploy(wallet, Identity, transaction.hash);
    expect(contract.address).to.be.properAddress;
  });

  describe('Execute', async () => {
    let expectedBalance;
    before(async () => {
      await wallet.send(contract.address, 100000);
      expectedBalance = (await otherWallet.getBalance()).add(10);
    });

    it('Execute signed transfer', async () => {
      const transferSignature = await messageSignature(wallet, otherWallet.address, contract.address, 10, '0x0', 0, gasToken, gasPrice, gasLimit);
      await chai.request(relayer.server)
        .post('/identity/execution')
        .send({
          contractAddress: contract.address,
          to: otherWallet.address,
          value: 10,
          data: '0x0',
          nonce: 0,
          gasToken,
          gasPrice,
          gasLimit,
          signature: transferSignature
        });
      expect(await otherWallet.getBalance()).to.eq(expectedBalance);
    });
  });

  after(async () => {
    relayer.stop();
  });
});


