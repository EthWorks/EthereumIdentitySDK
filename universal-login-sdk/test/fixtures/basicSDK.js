import EthereumIdentitySDK from '../../lib/sdk';
import {RelayerUnderTest} from 'universal-login-relayer';
import {getWallets, deployContract} from 'ethereum-waffle';
import {utils} from 'ethers';
import path from 'path';
import MockToken from 'universal-login-contracts/build/MockToken';
import MESSAGE_DEFAULTS from '../../lib/config';
import {getKnexConfig} from 'universal-login-relayer/lib/utils/knexUtils';

const config = getKnexConfig();
config.migrations.directory = path.join(__dirname, '../../../universal-login-relayer/migrations');

export default async function basicIdentityService(wallet) {
  let {provider} = wallet;
  const [,otherWallet, otherWallet2] = await getWallets(provider);
  const relayer = await RelayerUnderTest.createPreconfigured(provider, config);
  await relayer.start();
  ({provider} = relayer);
  const sdk = new EthereumIdentitySDK(relayer.url(), provider);
  const [privateKey, contractAddress] = await sdk.create('alex.mylogin.eth');
  const mockToken = await deployContract(wallet, MockToken);
  await mockToken.transfer(contractAddress, utils.parseEther('1.0'));
  await wallet.sendTransaction({to: contractAddress, value: utils.parseEther('1.0')});
  return {wallet, provider, mockToken, otherWallet, otherWallet2, sdk, privateKey, contractAddress, relayer};
}

export const transferMessage = {
  ...MESSAGE_DEFAULTS,
  to: '0x0000000000000000000000000000000000000001',
  value: utils.parseEther('0.5').toString()
};
