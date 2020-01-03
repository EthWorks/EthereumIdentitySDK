import {ContractWhiteList, IMessageValidator, MessageWithFrom, TEST_ACCOUNT_ADDRESS} from '@universal-login/commons';
import {expect} from 'chai';
import {loadFixture} from 'ethereum-waffle';
import {Contract, Wallet} from 'ethers';
import {getContractWhiteList} from '../../../../src/http/relayers/RelayerUnderTest';
import CorrectMasterValidator from '../../../../src/integration/ethereum/validators/CorrectMasterValidator';
import {getTestSignedMessage} from '../../../testconfig/message';
import basicWalletContractWithMockToken from '../../../fixtures/basicWalletContractWithMockToken';
import {Beta2Service} from '../../../../src/integration/ethereum/Beta2Service';
import {WalletContractService} from '../../../../src/integration/ethereum/WalletContractService';
import {BlockchainService} from '@universal-login/contracts';
import {GnosisSafeService} from '../../../../src/integration/ethereum/GnosisSafeService';

describe('INT: CorrectMasterValidator', async () => {
  let message: MessageWithFrom;
  let mockToken: Contract;
  let master: Contract;
  let walletContract: Contract;
  let wallet: Wallet;
  let validator: IMessageValidator;
  const contractWhiteList: ContractWhiteList = getContractWhiteList();
  let beta2Service: Beta2Service;
  let walletContractService: WalletContractService;

  before(async () => {
    ({mockToken, master, wallet, walletContract} = await loadFixture(basicWalletContractWithMockToken));
    message = {from: walletContract.address, gasToken: mockToken.address, to: TEST_ACCOUNT_ADDRESS};
    beta2Service = new Beta2Service(wallet.provider);
    const gnosisSafeService = new GnosisSafeService(wallet.provider);
    walletContractService = new WalletContractService(new BlockchainService(wallet.provider), beta2Service, gnosisSafeService);
    validator = new CorrectMasterValidator(wallet.provider, contractWhiteList, walletContractService);
  });

  it('successfully pass the validation', async () => {
    const signedMessage = getTestSignedMessage({...message}, wallet.privateKey);
    await expect(validator.validate(signedMessage)).to.not.be.rejected;
  });

  it('passes when invalid proxy but valid master', async () => {
    const validatorWithInvalidProxy = new CorrectMasterValidator(wallet.provider, {
      wallet: contractWhiteList.wallet,
      proxy: [TEST_ACCOUNT_ADDRESS],
    },
    walletContractService,
    );
    const signedMessage = getTestSignedMessage({...message}, wallet.privateKey);
    await expect(validatorWithInvalidProxy.validate(signedMessage)).to.not.be.rejected;
  });

  it('throws when invalid master', async () => {
    const validatorWithInvalidMaster = new CorrectMasterValidator(wallet.provider, {
      wallet: [TEST_ACCOUNT_ADDRESS],
      proxy: contractWhiteList.proxy,
    },
    walletContractService,
    );
    const signedMessage = getTestSignedMessage({...message}, wallet.privateKey);
    await expect(validatorWithInvalidMaster.validate(signedMessage)).to.be.eventually
      .rejectedWith(`Invalid master at address '${master.address}'. Deployed contract bytecode hash: '${contractWhiteList.wallet[0]}'. Supported bytecode hashes: [${TEST_ACCOUNT_ADDRESS}]`);
  });
});
