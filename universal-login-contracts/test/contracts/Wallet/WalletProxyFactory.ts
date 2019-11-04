import chai, {expect} from 'chai';
import {Contract, providers, Wallet, utils} from 'ethers';
import {getWallets, solidity, loadFixture, deployContract} from 'ethereum-waffle';
import {createKeyPair, signString, ETHER_NATIVE_TOKEN, DEPLOYMENT_REFUND} from '@universal-login/commons';
import WalletProxyFactory from '../../../build/WalletProxyFactory.json';
import WalletContract from '../../../build/Wallet.json';
import MockToken from '../../../build/MockToken.json';
import {ensAndMasterFixture} from '../../fixtures/walletContract';
import {switchENSNameInInitializeArgs} from '../../helpers/argumentsEncoding';
import {EnsDomainData, setupInitializeWithENSArgs, encodeInitializeWithENSData} from '../../../lib/encode.js';
import {CreateFutureDeploymentWithENS, createFutureDeploymentWithENS} from '../../../lib/FutureDeployment.js';

chai.use(solidity);

describe('Counterfactual Factory', () => {
  const keyPair = createKeyPair();
  let provider: providers.Provider;
  let wallet: Wallet;
  let anotherWallet: Wallet;
  let factoryContract: Contract;
  let ensDomainData: EnsDomainData;
  let walletContract: Contract;
  let initializeData: any;
  let futureAddress: string;
  let signature: string;
  let createFutureDeploymentArgs: CreateFutureDeploymentWithENS;
  const gasPrice = '1000000';

  beforeEach(async () => {
    ({ensDomainData, provider, factoryContract, walletContract} = await loadFixture(ensAndMasterFixture));
    [wallet, anotherWallet] = getWallets(provider);
    createFutureDeploymentArgs = {
      keyPair,
      walletContractAddress: walletContract.address,
      ensDomainData,
      factoryContract,
      gasPrice,
      gasToken: ETHER_NATIVE_TOKEN.address,
    };
    ({initializeData, futureAddress, signature} = createFutureDeploymentWithENS(createFutureDeploymentArgs));
  });

  it('factory contract address should be proper address', () => {
    expect(factoryContract.address).to.be.properAddress;
  });

  it('computeCounterfactualAddress function works', async () => {
    expect(futureAddress).to.be.properAddress;
  });

  it('creation fail if contract doesn`t have funds', async () => {
    await expect(factoryContract.createContract(keyPair.publicKey, initializeData, signature)).to.be.reverted;
  });

  it('should deploy contract with computed address', async () => {
    await wallet.sendTransaction({to: futureAddress, value: utils.parseEther('1.0')});
    await factoryContract.createContract(keyPair.publicKey, initializeData, signature);
    const proxyContract = new Contract(futureAddress, WalletContract.abi, wallet);
    expect(await proxyContract.keyExist(keyPair.publicKey)).to.be.true;
  });

  it('deploy with the same ens name', async () => {
    await wallet.sendTransaction({to: futureAddress, value: utils.parseEther('1.0')});
    await factoryContract.createContract(keyPair.publicKey, initializeData, signature);
    const newKeyPair = createKeyPair();
    ({initializeData, signature} = createFutureDeploymentWithENS({...createFutureDeploymentArgs, keyPair: newKeyPair}));
    await expect(factoryContract.createContract(newKeyPair.publicKey, initializeData, signature)).to.be.revertedWith('Unable to register ENS domain');
  });

  it('only owner can create contract', async () => {
    const factoryWithAnotherWallet = new Contract(factoryContract.address, WalletProxyFactory.abi, anotherWallet);
    await expect(factoryWithAnotherWallet.createContract(keyPair.publicKey, initializeData, signature)).to.be.reverted;
  });

  it('wallet refund after deploy', async () => {
    const {initializeData, futureAddress, signature} = createFutureDeploymentWithENS(createFutureDeploymentArgs);
    await wallet.sendTransaction({to: futureAddress, value: utils.parseEther('1.0')});
    const initBalance = await wallet.getBalance();
    await factoryContract.createContract(keyPair.publicKey, initializeData, signature, {gasPrice: utils.bigNumberify(createFutureDeploymentArgs.gasPrice)});
    expect(await wallet.getBalance()).to.be.above(initBalance);
  });

  it('should fail if signed ens name and passed in initialize data are different', async () => {
    const {futureAddress, signature} = createFutureDeploymentWithENS(createFutureDeploymentArgs);
    await wallet.sendTransaction({to: futureAddress, value: utils.parseEther('1.0')});
    const argsWithCorrectName = await setupInitializeWithENSArgs(createFutureDeploymentArgs);
    const argsWithInvalidName = switchENSNameInInitializeArgs(argsWithCorrectName, 'invalid-name');
    const initData = encodeInitializeWithENSData(argsWithInvalidName);
    await expect(factoryContract.createContract(keyPair.publicKey, initData, signature)).to.be.revertedWith('Invalid signature');
  });

  it('isValidSignature', async () => {
    const MAGICVALUE = '0x20c13b0b';
    await wallet.sendTransaction({to: futureAddress, value: utils.parseEther('1.0')});
    await factoryContract.createContract(keyPair.publicKey, initializeData, signature);
    const proxyContract = new Contract(futureAddress, WalletContract.abi, wallet);
    const message = 'Hi, I am Justyna and I wonder if length of this message matters';
    const messageHex = utils.hexlify(utils.toUtf8Bytes(message));
    const signature2 = signString(message, keyPair.privateKey);
    expect(await proxyContract.isValidSignature(messageHex, signature2)).to.eq(MAGICVALUE);
  });

  it('return in token after deploy', async () => {
    const mockToken = await deployContract(anotherWallet, MockToken);
    const {initializeData, futureAddress, signature} = createFutureDeploymentWithENS({...createFutureDeploymentArgs, gasToken: mockToken.address});
    await mockToken.transfer(futureAddress, utils.parseEther('1.0'));
    const expectedBalance = DEPLOYMENT_REFUND.mul(gasPrice);
    await factoryContract.createContract(keyPair.publicKey, initializeData, signature, {gasPrice: utils.bigNumberify(gasPrice)});
    expect(await mockToken.balanceOf(wallet.address)).to.be.eq(expectedBalance);
  });
});
