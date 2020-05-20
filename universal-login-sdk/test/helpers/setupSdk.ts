import {Wallet} from 'ethers';
import {TEST_SDK_CONFIG, TEST_GAS_MODES} from '@unilogin/commons';
import {RelayerUnderTest} from '@unilogin/relayer';
import UniLoginSdk from '../../src/api/sdk';
import {SdkConfig} from '../../src';

export async function setupSdk(deployer: Wallet, overridePort = '33111', overrideSdkConfig?: Partial<SdkConfig>) {
  const {relayer} = await RelayerUnderTest.createPreconfigured(deployer, overridePort);
  await relayer.start();
  const {provider} = relayer;
  (provider as any).pollingInterval = 10;
  const sdk = new UniLoginSdk(relayer.url(), provider, {...TEST_SDK_CONFIG, ...overrideSdkConfig});
  await sdk.fetchRelayerConfig();
  sdk.getGasModes = () => new Promise(resolve => resolve(TEST_GAS_MODES));
  sdk.priceObserver.getCurrentPrices = () => {
    return Promise.resolve({ETH: {USD: 100, DAI: 99, SAI: 99, ETH: 1}});
  };
  return {sdk, relayer, provider};
}
