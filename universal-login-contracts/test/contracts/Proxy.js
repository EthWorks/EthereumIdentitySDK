import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {deployContract, solidity, getWallets, loadFixture} from 'ethereum-waffle';
import {utils, Contract} from 'ethers';
import MockWalletMaster from '../../build/MockWalletMaster';
import Proxy from '../../build/Proxy';
import DEFAULT_PAYMENT_OPTIONS from '../../lib/defaultPaymentOptions';
import basicMasterAndProxy from '../fixtures/basicMasterAndProxy';

chai.use(chaiAsPromised);
chai.use(solidity);

const to = '0x0000000000000000000000000000000000000001';
const {gasPrice, gasLimit} = DEFAULT_PAYMENT_OPTIONS;

describe('CONTRACT: ProxyMasterCopy', async () => {
  let walletMaster;
  let walletProxy;
  let proxyAsWallet;
  let wallet;
  let data;

  beforeEach(async () => {
    ({walletMaster, walletProxy, proxyAsWallet, wallet} = await loadFixture(basicMasterAndProxy));
  });


  describe('Proxy', async () => {
    xit('updates master', async () => {
      await expect(proxyAsWallet.setMaster(to, [])).to.be.revertedWith('restricted-access');
    });

    it('deployment fails if masterCopy is zero', async () => {
      await expect(deployContract(wallet, Proxy, [0x0, []])).to.be.eventually.rejectedWith('invalid address');
    });

    it('should be properly constructed', async () => {
			expect(await proxyAsWallet.master()).to.eq(walletMaster.address);
    });

    it('should be able to send transaction to wallet', async () => {
      await expect(wallet.sendTransaction({to: proxyAsWallet.address, data: [], gasPrice, gasLimit})).to.be.fulfilled;
    });

    it('should call payable function in MasterCopy', async () => {
      data = new utils.Interface(MockWalletMaster.interface).functions.giveAway.encode([]);
      await wallet.sendTransaction({to: walletProxy.address, data, gasPrice, gasLimit});
    });

    it('should call function in MasterCopy', async () => {
      data = new utils.Interface(MockWalletMaster.interface).functions.increase.encode([]);
      const countBefore = await proxyAsWallet.count();
      await wallet.sendTransaction({to: walletProxy.address, data, gasPrice, gasLimit});
      const countAfter = await proxyAsWallet.count();
      expect(countAfter - countBefore).to.be.equal(1);
    });
  });
});
