import {ContractWhiteList, SupportedToken, LocalizationConfig, OnRampConfig, IPGeolocationApiConfig} from '@unilogin/commons';
import {KnexConfig} from './KnexConfig';

export interface Config {
  jsonRpcUrl?: string;
  port?: string;
  emailAddress: string;
  emailPassword: string;
  privateKey: string;
  ensAddress: string;
  network: string;
  ensRegistrars: string[];
  ensRegistrar: string;
  fallbackHandlerAddress: string;
  walletContractAddress: string;
  contractWhiteList: ContractWhiteList;
  factoryAddress: string;
  supportedTokens: SupportedToken[];
  localization: LocalizationConfig;
  onRampProviders: OnRampConfig;
  database: KnexConfig;
  maxGasLimit: number;
  ipGeolocationApi: IPGeolocationApiConfig;
  httpsRedirect: boolean;
}
