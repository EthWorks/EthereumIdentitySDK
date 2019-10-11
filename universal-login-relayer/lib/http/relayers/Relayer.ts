import express, {Application} from 'express';
import WalletRouter from '../routes/wallet';
import ConfigRouter, {getPublicConfig} from '../routes/config';
import RequestAuthorisationRouter from '../routes/authorisation';
import DevicesRouter from '../routes/devices';
import WalletService from '../../integration/ethereum/WalletService';
import ENSService from '../../integration/ethereum/ensService';
import bodyParser from 'body-parser';
import {Wallet, providers} from 'ethers';
import cors from 'cors';
import {EventEmitter} from 'fbemitter';
import useragent from 'express-useragent';
import Knex from 'knex';
import {Server} from 'http';
import {Config} from '../../config/relayer';
import MessageHandler from '../../core/services/MessageHandler';
import QueueSQLStore from '../../integration/sql/services/QueueSQLStore';
import errorHandler from '../middlewares/errorHandler';
import MessageSQLRepository from '../../integration/sql/services/MessageSQLRepository';
import AuthorisationService from '../../core/services/AuthorisationService';
import {IExecutionQueue} from '../../core/services/messages/IExecutionQueue';
import IMessageRepository from '../../core/services/messages/IMessagesRepository';
import {WalletDeployer} from '../../integration/ethereum/WalletDeployer';
import AuthorisationStore from '../../integration/sql/services/AuthorisationStore';
import WalletMasterContractService from '../../integration/ethereum/services/WalletMasterContractService';
import {MessageStatusService} from '../../core/services/messages/MessageStatusService';
import {SignaturesService} from '../../integration/ethereum/SignaturesService';
import IMessageValidator from '../../core/services/validators/IMessageValidator';
import MessageExecutionValidator from '../../integration/ethereum/validators/MessageExecutionValidator';
import MessageExecutor from '../../integration/ethereum/MessageExecutor';
import {BalanceChecker, RequiredBalanceChecker, PublicRelayerConfig} from '@universal-login/commons';
import {DevicesStore} from '../../integration/sql/services/DevicesStore';
import {DevicesService} from '../../core/services/DevicesService';
import {GasValidator} from '../../core/services/validators/GasValidator';
import DeploymentHandler from '../../core/services/DeploymentHandler';
import IRepository from '../../core/services/messages/IRepository';
import Deployment from '../../core/models/Deployment';
import SQLRepository from '../../integration/sql/services/SQLRepository';
import ExecutionWorker from '../../core/services/messages/ExecutionWorker';
import DeploymentExecutor from '../../integration/ethereum/DeploymentExecutor';
import {MinedTransactionHandler} from '../../core/services/execution/MinedTransactionHandler';

const defaultPort = '3311';


export type RelayerClass = {
  new (config: any, provider: providers.Provider): Relayer;
};

class Relayer {
  protected readonly port: string;
  protected readonly hooks: EventEmitter;
  public provider: providers.Provider;
  protected readonly wallet: Wallet;
  public readonly database: Knex;
  private ensService: ENSService = {} as ENSService;
  private authorisationStore: AuthorisationStore = {} as AuthorisationStore;
  private authorisationService: AuthorisationService = {} as AuthorisationService;
  private devicesStore: DevicesStore = {} as DevicesStore;
  private devicesService: DevicesService = {} as DevicesService;
  private walletMasterContractService: WalletMasterContractService = {} as WalletMasterContractService;
  private balanceChecker: BalanceChecker = {} as BalanceChecker;
  private requiredBalanceChecker: RequiredBalanceChecker = {} as RequiredBalanceChecker;
  private walletContractService: WalletService = {} as WalletService;
  private executionQueue: IExecutionQueue = {} as IExecutionQueue;
  private messageHandler: MessageHandler = {} as MessageHandler;
  private deploymentHandler: DeploymentHandler = {} as DeploymentHandler;
  private gasValidator: GasValidator = {} as GasValidator;
  private messageRepository: IMessageRepository = {} as IMessageRepository;
  private deploymentRepository: IRepository<Deployment> = {} as IRepository<Deployment>;
  private signaturesService: SignaturesService = {} as SignaturesService;
  private statusService: MessageStatusService = {} as MessageStatusService;
  private messageExecutionValidator: IMessageValidator = {} as IMessageValidator;
  private executionWorker: ExecutionWorker = {} as ExecutionWorker;
  private messageExecutor: MessageExecutor = {} as MessageExecutor;
  private deploymentExecutor: DeploymentExecutor = {} as DeploymentExecutor;
  private minedTransactionHandler: MinedTransactionHandler = {} as MinedTransactionHandler;
  private app: Application = {} as Application;
  protected server: Server = {} as Server;
  private walletDeployer: WalletDeployer = {} as WalletDeployer;
  public publicConfig: PublicRelayerConfig;

  constructor(protected config: Config, provider?: providers.Provider) {
    this.port = config.port || defaultPort;
    this.hooks = new EventEmitter();
    this.provider = provider || new providers.JsonRpcProvider(config.jsonRpcUrl, config.chainSpec);
    this.wallet = new Wallet(config.privateKey, this.provider);
    this.database = Knex(config.database);
    this.publicConfig = getPublicConfig(this.config);
    this.gasValidator = new GasValidator(this.publicConfig.maxGasLimit);
  }

  async start() {
    await this.database.migrate.latest();
    this.runServer();
    await this.ensService.start();
    this.executionWorker.start();
  }

  runServer() {
    this.app = express();
    this.app.use(useragent.express());
    this.app.use(cors({
      origin : '*',
      credentials: true,
    }));
    this.ensService = new ENSService(this.config.chainSpec.ensAddress, this.config.ensRegistrars, this.provider);
    this.authorisationStore = new AuthorisationStore(this.database);
    this.devicesStore = new DevicesStore(this.database);
    this.walletDeployer = new WalletDeployer(this.config.factoryAddress, this.wallet);
    this.balanceChecker = new BalanceChecker(this.provider);
    this.requiredBalanceChecker = new RequiredBalanceChecker(this.balanceChecker);
    this.walletMasterContractService = new WalletMasterContractService(this.provider);
    this.authorisationService = new AuthorisationService(this.authorisationStore, this.walletMasterContractService);
    this.devicesService = new DevicesService(this.devicesStore, this.walletMasterContractService);
    this.walletContractService = new WalletService(this.config, this.ensService, this.hooks, this.walletDeployer, this.requiredBalanceChecker, this.devicesService);
    this.messageRepository = new MessageSQLRepository(this.database);
    this.deploymentRepository = new SQLRepository(this.database, 'deployments');
    this.executionQueue = new QueueSQLStore(this.database);
    this.signaturesService = new SignaturesService(this.wallet);
    this.statusService = new MessageStatusService(this.messageRepository, this.signaturesService);
    this.messageExecutionValidator = new MessageExecutionValidator(this.wallet, this.config.contractWhiteList);
    this.deploymentHandler = new DeploymentHandler(this.walletContractService, this.deploymentRepository, this.executionQueue);
    this.minedTransactionHandler = new MinedTransactionHandler(this.hooks, this.authorisationStore, this.devicesService);
    this.messageHandler = new MessageHandler(this.wallet, this.messageRepository, this.statusService, this.gasValidator, this.executionQueue);
    this.messageExecutor = new MessageExecutor(this.wallet, this.messageExecutionValidator, this.messageRepository, this.minedTransactionHandler);
    this.deploymentExecutor = new DeploymentExecutor(this.deploymentRepository, this.walletContractService);
    this.executionWorker = new ExecutionWorker([this.messageExecutor, this.deploymentExecutor], this.executionQueue);
    this.app.use(bodyParser.json());
    this.app.use('/wallet', WalletRouter(this.deploymentHandler, this.messageHandler));
    this.app.use('/config', ConfigRouter(this.publicConfig));
    this.app.use('/authorisation', RequestAuthorisationRouter(this.authorisationService));
    this.app.use('/devices', DevicesRouter(this.devicesService));
    this.app.use(errorHandler);
    this.server = this.app.listen(this.port);
  }

  async stop() {
    await this.executionWorker.stop();
    await this.database.destroy();
    await this.server.close();
  }

  async stopLater() {
    await this.executionWorker.stopLater();
    await this.database.destroy();
    await this.server.close();
  }
}

export default Relayer;
