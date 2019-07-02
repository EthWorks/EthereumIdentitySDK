import {Wallet, ContractFactory} from 'ethers';
import {defaultDeployOptions, deployContract} from '@universal-login/commons';
import Factory from '@universal-login/contracts/build/ProxyCounterfactualFactory.json';
import ProxyContract from '@universal-login/contracts/build/Proxy.json';
import {getDeployData} from '@universal-login/contracts';


export default async function deployFactory(wallet: Wallet, walletMasterAddress: string): Promise<string> {
  const initData = getDeployData(ProxyContract, [walletMasterAddress, '0x0']);
  console.log('Deploying factory contract...');
  const contract = await deployContract(wallet, Factory, [initData]);
  console.log(`Factory contract address: ${contract.address}`);
  return contract.address;
}
