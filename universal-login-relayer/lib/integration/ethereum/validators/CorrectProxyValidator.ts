import {utils} from 'ethers';
import {Provider} from 'ethers/providers';
import {ContractWhiteList, SignedMessage, ensure, IMessageValidator} from '@universal-login/commons';
import {InvalidProxy} from '../../../core/utils/errors';

export default class CorrectProxyValidator implements IMessageValidator {
  constructor(private provider: Provider, private contractWhiteList: ContractWhiteList) {}

  async validate(signedMessage: SignedMessage) {
    const proxyByteCode = await this.provider.getCode(signedMessage.from);
    const proxyContractHash = utils.keccak256(proxyByteCode);
    ensure(
      this.contractWhiteList.proxy.includes(proxyContractHash),
      InvalidProxy,
      signedMessage.from,
      proxyContractHash,
      this.contractWhiteList.proxy);
  }
}
