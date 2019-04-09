import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import {RelayerUnderTest} from '../../../lib/utils/relayerUnderTest';
import {utils} from 'ethers';
import {createMockProvider, getWallets, deployContract} from 'ethereum-waffle';
import {waitForContractDeploy} from '@universal-login/commons';
import {calculateMessageSignature, OPERATION_CALL} from '@universal-login/contracts';
import WalletContract from '@universal-login/contracts/build/Wallet';
import MockToken from '@universal-login/contracts/build/MockToken';
import {startRelayer} from './helpers';

chai.use(chaiHttp);

describe('E2E: Relayer - WalletContract routes', async () => {
  let relayer;
  let provider;
  let wallet;
  let otherWallet;
  let contract;
  let deployer;

  before(async () => {
    ({provider, wallet, otherWallet, relayer, deployer} = await startRelayer());
  });

  it('Create', async () => {
    const result = await chai.request(relayer.server)
      .post('/wallet')
      .send({
        managementKey: wallet.address,
        ensName: 'marek.mylogin.eth',
      });
    const {transaction} = result.body;
    contract = await waitForContractDeploy(provider, WalletContract, transaction.hash);
    expect(contract.address).to.be.properAddress;
  });

  describe('Execute', async () => {
    let token;

    before(async () => {
      await deployer.sendTransaction({to: contract.address, value: utils.parseEther('1.0')});
      token = await deployContract(deployer, MockToken, []);
      await token.transfer(contract.address, utils.parseEther('1.0'));
    });

    it('Execute signed transfer', async () => {
      const msg = {
        from: contract.address,
        to: otherWallet.address,
        value: 1000000000,
        data: [],
        nonce: 0,
        gasToken: token.address,
        gasPrice: 110000000,
        gasLimit: 1000000,
        operationType: OPERATION_CALL,
      };
      const balanceBefore = await provider.getBalance(otherWallet.address);
      const signature = await calculateMessageSignature(wallet.privateKey, msg);
      await chai.request(relayer.server)
        .post('/wallet/execution')
        .send({
          ...msg,
          signature,
        });
      expect(await provider.getBalance(otherWallet.address)).to.eq(balanceBefore.add(msg.value));
    });
  });

  after(async () => {
    await relayer.stop();
  });
});
