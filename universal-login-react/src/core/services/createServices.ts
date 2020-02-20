import React from 'react';
import UniversalLoginSDK from '@unilogin/sdk';
import {providers} from 'ethers';
import {Config} from '../../config/types';

export interface Overrides {
  provider?: providers.Provider;
}

export const createServices = (config: Config, {provider}: Overrides = {}) => {
  const providerOrProviderUrl = provider || config.jsonRpcUrl;
  const sdk = new UniversalLoginSDK(config.relayerUrl, providerOrProviderUrl, {applicationInfo: {type: 'laptop'}, observedTokensAddresses: config.tokens, saiTokenAddress: config.saiTokenAddress});
  sdk.featureFlagsService.enableAll(new URLSearchParams(window.location.search).getAll('feature'));
  return {
    sdk,
    config,
  };
};

export type Services = ReturnType<typeof createServices>;

export const ServiceContext = React.createContext({} as Services);
