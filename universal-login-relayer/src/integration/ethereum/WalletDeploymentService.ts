import {utils} from 'ethers';
import {DeployArgs, DEPLOY_GAS_LIMIT, ensure, getInitializeSigner, DeviceInfo} from '@unilogin/commons';
import {computeGnosisCounterfactualAddress, encodeDataForSetup, gnosisSafe, INITIAL_REQUIRED_CONFIRMATIONS} from '@unilogin/contracts';
import ENSService from './ensService';
import {InvalidSignature} from '../../core/utils/errors';
import {Config} from '../../config/relayer';
import {WalletDeployer} from './WalletDeployer';
import {DevicesService} from '../../core/services/DevicesService';
import {TransactionGasPriceComputator} from './TransactionGasPriceComputator';
import {BalanceValidator} from './BalanceValidator';

export class WalletDeploymentService {
  constructor(
    private config: Config,
    private ensService: ENSService,
    private walletDeployer: WalletDeployer,
    private balanceValidator: BalanceValidator,
    private devicesService: DevicesService,
    private transactionGasPriceComputator: TransactionGasPriceComputator,
  ) {}

  async setupInitializeData({publicKey, ensName, gasPrice, gasToken}: Omit<DeployArgs, 'signature'>) {
    const ensArgs = await this.ensService.argsFor(ensName);
    const deployment = {
      owners: [publicKey],
      requiredConfirmations: INITIAL_REQUIRED_CONFIRMATIONS,
      deploymentCallAddress: this.config.ensRegistrar,
      deploymentCallData: new utils.Interface(gnosisSafe.ENSRegistrar.interface as any).functions.register.encode(ensArgs),
      fallbackHandler: this.config.fallbackHandlerAddress,
      paymentToken: gasToken,
      payment: utils.bigNumberify(gasPrice).mul(DEPLOY_GAS_LIMIT).toString(),
      refundReceiver: this.walletDeployer.wallet.address,
    };
    return encodeDataForSetup(deployment as any);
  }

  private async computeFutureAddress(setupData: string) {
    return computeGnosisCounterfactualAddress(this.config.factoryAddress, 1, setupData, this.config.walletContractAddress);
  }

  async deploy({publicKey, ensName, gasPrice, gasToken, signature}: DeployArgs, deviceInfo: DeviceInfo) {
    const initWithENS = await this.setupInitializeData({publicKey, ensName, gasPrice, gasToken});
    ensure(getInitializeSigner(initWithENS, signature) === publicKey, InvalidSignature);
    const contractAddress = await this.computeFutureAddress(initWithENS);
    const transactionFeeInToken = utils.bigNumberify(gasPrice).mul(DEPLOY_GAS_LIMIT);
    await this.balanceValidator.validate(contractAddress, gasToken, transactionFeeInToken);
    const transaction = await this.walletDeployer.deploy(this.config.walletContractAddress, initWithENS, '1', {gasLimit: DEPLOY_GAS_LIMIT, gasPrice: await this.transactionGasPriceComputator.getGasPrice(gasPrice)});
    await this.devicesService.addOrUpdate(contractAddress, publicKey, deviceInfo);
    return transaction;
  }
}
