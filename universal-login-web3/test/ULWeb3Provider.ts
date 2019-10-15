import {expect} from 'chai';
import {utils, Wallet} from 'ethers';
import {waitExpect} from '@universal-login/commons';
import Web3 from 'web3';
import {AppProps} from '../lib/ui/App';
import {RelayerUnderTest} from '@universal-login/relayer';
import {createWallet} from './helpers/createWallet';
import {setupTestEnvironmentWithWeb3} from './helpers/setupTestEnvironmentWithWeb3';
import {ULWeb3Provider} from '../lib';

describe('ULWeb3Provier', () => {
  let relayer: RelayerUnderTest;
  let deployer: Wallet;
  let services: AppProps;
  let web3: Web3;
  let ulProvider: ULWeb3Provider;

  beforeEach(async () => {
    ({relayer, deployer, services, web3, ulProvider} = await setupTestEnvironmentWithWeb3());
  });

  afterEach(async () => {
    await relayer.clearDatabase();
    await relayer.stop();
  });

  describe('send transaction', () => {
    it('triggers wallet create flow', async () => {
      expect(services.uiController.showOnboarding.get()).to.be.false;

      web3.eth.sendTransaction({
        to: Wallet.createRandom().address,
        value: utils.parseEther('0.005').toString(),
      });

      await waitExpect(() => {
        return expect(services.uiController.showOnboarding.get()).to.be.true;
      });
    });

    it('can send a simple eth transfer', async () => {
      const deployedWallet = await createWallet('bob.mylogin.eth', services.sdk, deployer);
      services.walletService.setWallet(deployedWallet.asApplicationWallet);

      const {transactionHash} = await web3.eth.sendTransaction({
        to: Wallet.createRandom().address,
        value: utils.parseEther('0.005').toString(),
      });

      const receipt = await web3.eth.getTransactionReceipt(transactionHash);
      expect(receipt.to).to.eq(deployedWallet.contractAddress.toLowerCase());
    });

    it('sends transactions that originated before wallet was created', async () => {
      const promise = web3.eth.sendTransaction({
        to: Wallet.createRandom().address,
        value: utils.parseEther('0.005').toString(),
      });

      const deployedWallet = await createWallet('bob.mylogin.eth', services.sdk, deployer);
      services.walletService.setWallet(deployedWallet.asApplicationWallet);

      const { transactionHash } = await promise;
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);
      expect(receipt.to).to.eq(deployedWallet.contractAddress.toLowerCase());
    });
  });

  describe('get accounts', () => {
    it('returns empty array when wallet does not exist', async () => {
      expect(await web3.eth.getAccounts()).to.deep.eq([]);
    });

    it('returns single address when wallet is connected', async () => {
      const deployedWallet = await createWallet('bob.mylogin.eth', services.sdk, deployer);
      services.walletService.setWallet(deployedWallet.asApplicationWallet);

      expect(await web3.eth.getAccounts()).to.deep.eq([deployedWallet.contractAddress]);
    });
  });

  describe('sign', () => {
    const message = 'message';

    it('web3.eth.sign', async () => {
      const deployedWallet = await createWallet('bob.mylogin.eth', services.sdk, deployer);
      services.walletService.setWallet(deployedWallet.asApplicationWallet);

      const signature = await web3.eth.sign(message, deployedWallet.contractAddress);

      const expectedSignature = deployedWallet.signMessage(utils.toUtf8Bytes(message));
      expect(signature).to.eq(expectedSignature);
    });

    it('web3.eth.personal.sign', async () => {
      const deployedWallet = await createWallet('bob.mylogin.eth', services.sdk, deployer);
      services.walletService.setWallet(deployedWallet.asApplicationWallet);

      // wrong library typedefs here
      const signature = await (web3.eth.personal.sign as any)(message, deployedWallet.contractAddress, '');

      const expectedSignature = deployedWallet.signMessage(utils.toUtf8Bytes(message));
      expect(signature).to.eq(expectedSignature);
    });
  });

  describe('create', () => {
    it('if there is not wallet it shows the UI and returns a promise that resolves once the wallet is created', async () => {
      let isResolved = false;
      ulProvider.create().then(() => {
        isResolved = true;
      }).catch();

      expect(services.uiController.showOnboarding.get()).to.be.true;
      expect(isResolved).to.be.false;

      const deployedWallet = await createWallet('bob.mylogin.eth', services.sdk, deployer);
      services.walletService.setWallet(deployedWallet.asApplicationWallet);

      await waitExpect(() => {
        expect(services.uiController.showOnboarding.get()).to.be.false;
        expect(isResolved).to.be.true;
      });
    });

    it('doesnt show the UI if wallet is already there', async () => {
      const deployedWallet = await createWallet('bob.mylogin.eth', services.sdk, deployer);
      services.walletService.setWallet(deployedWallet.asApplicationWallet);

      let isResolved = false;
      ulProvider.create().then(() => {
        isResolved = true;
      }).catch();

      expect(services.uiController.showOnboarding.get()).to.be.false;
      await waitExpect(() => {
        expect(isResolved).to.be.true;
      });
    });
  });
});
