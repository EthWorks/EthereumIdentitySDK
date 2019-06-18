import {expect} from 'chai';
import sinon from 'sinon';
import {waitExpect, TEST_ACCOUNT_ADDRESS, getDeployedBytecode} from '@universal-login/commons';
import ProxyContract from '@universal-login/contracts/build/Proxy.json';
import {DeploymentObserver} from '../../lib/observers/DeploymentObserver';
import {getContractWhiteList} from '@universal-login/relayer';

describe('UNIT: DeploymentObserver', async () => {
  const contractWhiteList = getContractWhiteList();
  const expectedBytecode = `0x${getDeployedBytecode(ProxyContract)}`;
  const blockchainService = {getCode: sinon.stub().returns('0x').onCall(3).returns(expectedBytecode)};
  let deploymentObserver: DeploymentObserver;

  beforeEach(() => {
    deploymentObserver = new DeploymentObserver(blockchainService as any, contractWhiteList);
    deploymentObserver.step = 10;
  });

  it('calls calback if contract deployed', async () => {
    const callback = sinon.spy();
    deploymentObserver.startAndSubscribe(TEST_ACCOUNT_ADDRESS, callback);
    await waitExpect(() => expect(callback).calledWith(TEST_ACCOUNT_ADDRESS, expectedBytecode));
  });

  it('throws if observer already is started', async () => {
    const callback = sinon.spy();
    deploymentObserver.startAndSubscribe(TEST_ACCOUNT_ADDRESS, callback);
    expect(() => deploymentObserver.startAndSubscribe(TEST_ACCOUNT_ADDRESS, callback)).throws('DeploymentObserver is waiting for contract deployment. Stop observer to cancel waiting');
  });

  afterEach(() => {
    blockchainService.getCode.resetHistory();
  });
});
