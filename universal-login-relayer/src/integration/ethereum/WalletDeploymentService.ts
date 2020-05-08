import {utils} from 'ethers';
import {DeployArgs, DEPLOY_GAS_LIMIT, ensure, getInitializeSigner, DeviceInfo, MINIMAL_DEPLOYMENT_GAS_LIMIT, safeMultiplyAndFormatEther, SupportedToken} from '@unilogin/commons';
import {computeGnosisCounterfactualAddress, encodeDataForSetup, gnosisSafe, INITIAL_REQUIRED_CONFIRMATIONS} from '@unilogin/contracts';
import ENSService from './ensService';
import {InvalidSignature} from '../../core/utils/errors';
import {Config} from '../../config/relayer';
import {WalletDeployer} from './WalletDeployer';
import {DevicesService} from '../../core/services/DevicesService';
import {TransactionGasPriceComputator} from './TransactionGasPriceComputator';
import {DeploymentBalanceChecker} from './DeploymentBalanceChecker';
import {FutureWalletStore} from '../sql/services/FutureWalletStore';

export class WalletDeploymentService {
  private readonly supportedTokens: SupportedToken[] = this.config.supportedTokens;

  constructor(
    private config: Config,
    private ensService: ENSService,
    private walletDeployer: WalletDeployer,
    private deploymentBalanceChecker: DeploymentBalanceChecker,
    private devicesService: DevicesService,
    private transactionGasPriceComputator: TransactionGasPriceComputator,
    private futureWalletStore: FutureWalletStore,
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
    const {tokenPriceInETH} = await this.futureWalletStore.getGasPriceInToken(contractAddress);
    const gasUsedInToken = utils.bigNumberify(tokenPriceInETH).mul(DEPLOY_GAS_LIMIT);
    const transactionFeeInToken = gasUsedInToken.mul(gasPrice);
    await this.deploymentBalanceChecker.validateBalance(contractAddress, gasToken, transactionFeeInToken);
    const transaction = await this.walletDeployer.deploy(this.config.walletContractAddress, initWithENS, '1', {gasLimit: DEPLOY_GAS_LIMIT, gasPrice: await this.transactionGasPriceComputator.getGasPrice(gasPrice)});
    await this.devicesService.addOrUpdate(contractAddress, publicKey, deviceInfo);
    return transaction;
  }

  getTokensWithMinimalAmount(gasPrice: utils.BigNumberish) {
    return this.supportedTokens.map((supportedToken) =>
      ({...supportedToken, minimalAmount: safeMultiplyAndFormatEther(utils.bigNumberify(MINIMAL_DEPLOYMENT_GAS_LIMIT), gasPrice)}));
  }
}
