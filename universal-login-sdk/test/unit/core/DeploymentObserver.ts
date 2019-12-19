import {expect} from 'chai';
import sinon from 'sinon';
import {TEST_ACCOUNT_ADDRESS, getDeployedBytecode} from '@universal-login/commons';
import {waitExpect} from '@universal-login/commons/testutils';
import ProxyContract from '@universal-login/contracts/build/WalletProxy.json';
import {DeploymentObserver} from '../../../src/core/observers/DeploymentObserver';
import {getContractWhiteList} from '@universal-login/relayer';

describe('UNIT: DeploymentObserver', async () => {
  const contractWhiteList = getContractWhiteList();
  const expectedBytecode = `0x${getDeployedBytecode(ProxyContract)}`;
  const blockchainService = {getCode: sinon.stub().returns('0x').onCall(3).returns(expectedBytecode)};
  let deploymentObserver: DeploymentObserver;

  beforeEach(() => {
    deploymentObserver = new DeploymentObserver(blockchainService as any, contractWhiteList);
    deploymentObserver.tick = 10;
  });

  it('calls calback if contract deployed', async () => {
    const callback = sinon.spy();
    deploymentObserver.startAndSubscribe(TEST_ACCOUNT_ADDRESS, callback);
    await waitExpect(() => expect(callback).calledWith(TEST_ACCOUNT_ADDRESS));
  });

  it('throws if observer already is started', async () => {
    const callback = sinon.spy();
    deploymentObserver.startAndSubscribe(TEST_ACCOUNT_ADDRESS, callback);
    expect(() => deploymentObserver.startAndSubscribe(TEST_ACCOUNT_ADDRESS, callback)).throws('Other wallet waiting for counterfactual deployment. Stop observer to cancel old wallet instantialisation.');
  });

  afterEach(() => {
    blockchainService.getCode.resetHistory();
  });
});
