import React from 'react';
import {utils} from 'ethers';
import {DeployedWallet} from '@unilogin/sdk';
import {TokenDetailsWithBalance, ValueRounder} from '@unilogin/commons';
import {Asset} from './Asset';
import './../styles/base/assetsList.sass';
import './../styles/themes/Legacy/assetsListThemeLegacy.sass';
import './../styles/themes/UniLogin/assetsListThemeUnilogin.sass';
import './../styles/themes/Jarvis/assetsListThemeJarvis.sass';
import {getIconForToken} from '../../core/utils/getIconForToken';
import {useBalances} from '../hooks/useBalances';
import {ThemedComponent} from './ThemedComponent';
import {filterTokensWithZeroBalance} from '../../app/filterTokensWithZeroBalance';

export interface AssetsProps {
  deployedWallet: DeployedWallet;
}

export const Assets = ({deployedWallet}: AssetsProps) => {
  const [tokenDetailsWithBalance] = useBalances(deployedWallet);

  return (
    <ThemedComponent name="assets">
      <div className="assets">
        <p className="assets-title">My Assets</p>
        <div className="assets-list">
          {filterTokensWithZeroBalance(tokenDetailsWithBalance).map(({name, symbol, balance}: TokenDetailsWithBalance) => (
            <Asset
              key={`${name}-${symbol}`}
              sdk={deployedWallet.sdk}
              name={name}
              symbol={symbol}
              balance={ValueRounder.ceil(utils.formatEther(balance))!}
              icon={getIconForToken(symbol)}
            />
          ))}
        </div>
      </div>
    </ThemedComponent>
  );
};
