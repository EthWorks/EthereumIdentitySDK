import ethers, {providers, utils} from 'ethers';

const addressToBytes32 = (address) =>
  utils.padZeros(utils.arrayify(address), 32);

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitForContractDeploy = async (providerOrWallet, contractJSON, tansactionHash, tick = 1000) => {
  const provider = providerOrWallet.provider ? providerOrWallet.provider : providerOrWallet;
  const abi = contractJSON.interface;
  let receipt = await provider.getTransactionReceipt(tansactionHash);
  while (!receipt) {
    sleep(tick);
    receipt = await provider.getTransactionReceipt(tansactionHash);
  }
  return new ethers.Contract(receipt.contractAddress, abi, providerOrWallet);
};

const messageSignature = (wallet, to, amount, data) =>
  wallet.signMessage(
    utils.arrayify(utils.solidityKeccak256(
      ['address', 'uint256', 'bytes'],
      [to, amount, data])
    ));

const messageSignatureForApprovals = (wallet, id) =>
  wallet.signMessage(
    utils.arrayify(utils.solidityKeccak256(
      ['uint256'],
      [id])
    ));

const withENS = (provider, ensAddress) => {
  const chainOptions = {ensAddress, chainId: 0};
  // eslint-disable-next-line no-underscore-dangle
  return new providers.Web3Provider(provider._web3Provider, chainOptions);
};

export {addressToBytes32, waitForContractDeploy, messageSignature, messageSignatureForApprovals, withENS};
