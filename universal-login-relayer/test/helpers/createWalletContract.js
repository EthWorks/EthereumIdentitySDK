import {ContractFactory, Contract, utils} from 'ethers';
import {defaultDeployOptions, TEST_GAS_PRICE, ETHER_NATIVE_TOKEN} from '@universal-login/commons';
import WalletProxy from '@universal-login/contracts/contracts/WalletProxy.json';
import WalletContract from '@universal-login/contracts/contracts/Wallet.json';
import {encodeInitializeData, deployWalletContract} from '@universal-login/contracts';

export default async function createWalletContract(wallet) {
  const walletContract = await deployWalletContract(wallet);
  const factory = new ContractFactory(
    WalletProxy.interface,
    `0x${WalletProxy.evm.bytecode.object}`,
    wallet,
  );
  const initData = encodeInitializeData([wallet.address, TEST_GAS_PRICE, ETHER_NATIVE_TOKEN.address]);
  const proxyArgs = [walletContract.address];
  const proxyContract = await factory.deploy(...proxyArgs, defaultDeployOptions);
  await wallet.sendTransaction({to: proxyContract.address, value: utils.parseEther('1.0')});
  await wallet.sendTransaction({to: proxyContract.address, data: initData});
  return {
    proxy: new Contract(proxyContract.address, WalletContract.abi, wallet),
    master: walletContract,
  };
}
