import {EventEmitter} from 'fbemitter';
import sinon from 'sinon';
import {Wallet, Contract, utils} from 'ethers';
import {computeCounterfactualAddress, TEST_GAS_PRICE, KeyPair, calculateInitializeSignature, ETHER_NATIVE_TOKEN} from '@universal-login/commons';
import {deployFactory, encodeInitializeWithENSData, deployWalletContract} from '@universal-login/contracts';
import WalletService from '../../src/integration/ethereum/WalletService';
import buildEnsService from './buildEnsService';
import {WalletDeployer} from '../../src/integration/ethereum/WalletDeployer';
import ENSService from '../../src/integration/ethereum/ensService';

export default async function setupWalletService(wallet: Wallet) {
  const [ensService, provider] = await buildEnsService(wallet, 'mylogin.eth');
  const walletContractAddress = (await deployWalletContract(wallet)).address;
  const factoryContract = await deployFactory(wallet, walletContractAddress);
  const hooks = new EventEmitter();
  const config = {walletContractAddress, factoryAddress: factoryContract.address, supportedTokens: []};
  const walletDeployer = new WalletDeployer(factoryContract.address, wallet);
  const fakeBalanceChecker = {
    findTokenWithRequiredBalance: () => true,
  };
  const fakeDevicesService = {
    addOrUpdate: sinon.spy(),
  };
  const walletService = new WalletService(config as any, ensService, hooks, walletDeployer, fakeBalanceChecker as any, fakeDevicesService as any);
  const callback = sinon.spy();
  hooks.addListener('created', callback);
  return {provider, wallet, walletService, callback, factoryContract, ensService, fakeDevicesService};
}

export const createFutureWallet = async (keyPair: KeyPair, ensName: string, factoryContract: Contract, wallet: Wallet, ensService: ENSService) => {
  const futureContractAddress = computeCounterfactualAddress(factoryContract.address, keyPair.publicKey, await factoryContract.initCode());
  await wallet.sendTransaction({to: futureContractAddress, value: utils.parseEther('1')});
  const args = await ensService.argsFor(ensName) as string[];
  const initData = encodeInitializeWithENSData([keyPair.publicKey, ...args, TEST_GAS_PRICE, ETHER_NATIVE_TOKEN.address]);
  const signature = await calculateInitializeSignature(initData, keyPair.privateKey);
  return {signature, futureContractAddress};
};
