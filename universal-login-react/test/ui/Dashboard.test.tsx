import {expect} from 'chai';
import {mount, ReactWrapper} from 'enzyme';
import React from 'react';
import {getWallets, createMockProvider} from 'ethereum-waffle';
import {DeployedWallet} from '@unilogin/sdk';
import {Dashboard} from '../../src/ui/UFlow/Dashboard';
import {waitExpect} from '@unilogin/commons/testutils';
import {Wallet, utils} from 'ethers';
import {DashboardPage} from '../helpers/pages/DashboardPage';
import {setupDeployedWallet} from '../helpers/setupDeploymentWallet';

describe('INT: Dashboard', () => {
  let wallet: Wallet;
  const ensName = 'jarek.mylogin.eth';
  const initialAmount = '198.60';
  let deployedWallet: DeployedWallet;
  let dashboard: DashboardPage;
  let relayer: any;
  let appWrapper: ReactWrapper;

  beforeEach(async () => {
    ([wallet] = getWallets(createMockProvider()));
    ({deployedWallet, relayer} = await setupDeployedWallet(wallet, ensName));
    appWrapper = mount(<Dashboard deployedWallet={deployedWallet} />);
    dashboard = new DashboardPage(appWrapper);
  });

  it('update usd balance amount', async () => {
    dashboard.clickInitButton();
    await waitExpect(() =>
      expect(dashboard.funds().getUsdBalance()).to.eq(`$${initialAmount}`),
    );
    await wallet.sendTransaction({
      to: deployedWallet.contractAddress,
      value: utils.parseEther('2'),
    });
    await waitExpect(() =>
      expect(dashboard.funds().getUsdBalance()).to.eq('$398.60'),
    );
  });

  after(async () => {
    appWrapper.unmount();
    await deployedWallet.sdk.stop();
    await relayer.stop();
  });
});
