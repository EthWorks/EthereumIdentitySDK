import {Wallet} from 'ethers';
import {ContractWhiteList} from '@universal-login/commons';
import {ComposeValidator} from '../../../core/services/validators/ComposeValidator';
import CorrectProxyValidator from './CorrectProxyValidator';
import CorrectMasterValidator from './CorrectMasterValidator';
import EnoughTokenValidator from './EnoughTokenValidator';
import EstimateGasValidator from './EstimateGasValidator';

export class MessageExecutionValidator extends ComposeValidator {
  constructor(wallet: Wallet, contractWhiteList: ContractWhiteList) {
    super([
      new CorrectProxyValidator(wallet.provider, contractWhiteList),
      new CorrectMasterValidator(wallet.provider, contractWhiteList),
      new EnoughTokenValidator(wallet.provider),
      new EstimateGasValidator(wallet),
    ]);
  }
}

export default MessageExecutionValidator;
