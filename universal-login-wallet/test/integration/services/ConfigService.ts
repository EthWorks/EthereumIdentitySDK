import chai, {expect} from 'chai';
import {getWallets, createMockProvider, solidity} from 'ethereum-waffle';
import Relayer from '@universal-login/relayer';
import UniversalLoginSDK from '@universal-login/sdk';
import {setupSdk} from '@universal-login/sdk/testutils';
import {ConfigService} from '../../../src/core/services/ConfigService';

chai.use(solidity);

describe('INT: ConfigService', async () => {
  let sdk: UniversalLoginSDK;
  let relayer: Relayer;

  before(async () => {
    const [wallet] = getWallets(createMockProvider());
    ({sdk, relayer} = await setupSdk(wallet));
  });

  it('Cache and get config', async () => {
    const configService = new ConfigService(sdk);
    expect(await configService.getRelayerConfig()).to.eq(sdk.getRelayerConfig());
  });

  after(async () => {
    await relayer.stop();
  });
});
