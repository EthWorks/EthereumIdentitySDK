import Web3 from 'web3';
import {Web3PickerProvider} from '../Web3PickerProvider';
import {Web3ProviderFactory} from '../models/Web3ProviderFactory';
import {setupStrategies} from '../utils/setupStrategies';
import {getApplicationInfoFromDocument} from '../ui/utils/applicationInfo';
import {ApplicationInfo} from '@universal-login/commons';

export type Strategy = 'UniLogin' | 'Metamask' | Web3ProviderFactory;

export class UniLogin {
  static setupWeb3Picker(web3: Web3, strategies: Strategy[], givenApplicationInfo?: Partial<ApplicationInfo>) {
    const provider = web3.currentProvider;
    const applicationInfo = {...getApplicationInfoFromDocument(), ...givenApplicationInfo};
    const web3ProviderFactories = setupStrategies(web3, strategies, {applicationInfo});
    const web3Strategy = new Web3PickerProvider(web3ProviderFactories, provider);
    web3.setProvider(web3Strategy);
    return web3Strategy;
  }
}
