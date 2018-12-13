const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitToBeMined = async (provider, transactionHash, tick = 1000) => {
  let receipt = await provider.getTransactionReceipt(transactionHash);
  while (!receipt || !receipt.blockNumber) {
    await sleep(tick);
    receipt = await provider.getTransactionReceipt(transactionHash);
  }
  return receipt;
};

export {sleep, waitToBeMined};
