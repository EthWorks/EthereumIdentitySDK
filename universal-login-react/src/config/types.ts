import {IPGeolocationApiConfig} from '@universal-login/commons';

export interface Config {
  domains: string[];
  relayerUrl: string;
  jsonRpcUrl: string;
  tokens: string[];
  saiTokenAddress?: string;
  ipGeolocationApi: IPGeolocationApiConfig;
}
