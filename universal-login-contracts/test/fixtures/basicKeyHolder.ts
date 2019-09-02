import KeyHolder from '../../build/KeyHolder.json';
import MockContract from '../../build/MockContract.json';
import {utils, Wallet} from 'ethers';
import {deployContract} from 'ethereum-waffle';
import {Provider} from 'ethers/providers';

export default async function basicKeyHolder(
  provider : Provider,
  [managementWallet, actionWallet, unknownWallet, anotherWallet, targetWallet, anotherWallet2, , , , wallet]: Wallet[],
) {
  const managementKey = wallet.address;
  const managementWalletKey = managementWallet.address;
  const actionWalletKey = actionWallet.address;
  const publicKey = anotherWallet.address;
  const actionKey2 = anotherWallet2.address;
  const unknownWalletKey = unknownWallet.address;
  const walletContract = await deployContract(wallet, KeyHolder, [managementKey]);
  const mockContract = await deployContract(wallet, MockContract);
  const fromManagementWallet = await walletContract.connect(managementWallet);
  const fromActionWallet = await walletContract.connect(actionWallet);
  const fromUnknownWallet = await walletContract.connect(unknownWallet);

  await walletContract.addKey(managementWalletKey);
  await walletContract.addKey(actionWalletKey);
  await wallet.sendTransaction({to: walletContract.address, value: utils.parseEther('1.0')});
  return {provider, walletContract, mockContract, wallet,
    targetWallet, publicKey, actionKey2, managementKey, unknownWalletKey, managementWalletKey,
    fromManagementWallet, fromActionWallet, fromUnknownWallet,
  };
}
