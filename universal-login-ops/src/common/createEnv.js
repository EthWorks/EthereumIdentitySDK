function createEnv({jsonRpcUrl, daiTokenAddress, saiTokenAddress, ensAddress, ensDomains, walletContractAddress}) {
  const env = {
    ENS_ADDRESS: ensAddress,
    JSON_RPC_URL: jsonRpcUrl,
    DAI_TOKEN_ADDRESS: daiTokenAddress,
    SAI_TOKEN_ADDRESS: saiTokenAddress,
    RELAYER_URL: 'http://localhost:3311',
    WALLET_MASTER_ADDRESS: walletContractAddress,
  };
  ensDomains.forEach((domain, index) => {
    env[`ENS_DOMAIN_${index + 1}`] = domain;
  });
  return env;
}

module.exports = createEnv;
