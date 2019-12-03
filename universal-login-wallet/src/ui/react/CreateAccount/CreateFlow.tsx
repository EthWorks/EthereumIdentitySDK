import React, {useEffect} from 'react';
import {useHistory} from 'react-router';
import {ensure} from '@universal-login/commons';
import {TopUp} from '@universal-login/react';
import {useServices} from '../../hooks';

export function CreateFlow() {
  const {sdk, walletService} = useServices();
  const history = useHistory();

  ensure(walletService.state.kind === 'Future', Error, 'Invalid state')
  const wallet = walletService.state.wallet;

  useEffect(() => {
    wallet.waitForBalance()
      .then(() => walletService.initDeploy())
      .then(() => history.push('/create/waiting'))
      .catch(console.error);
  }, []);


  return (
    <div className="main-bg">
      <TopUp
        sdk={sdk}
        contractAddress={wallet.contractAddress}
        isDeployment
        isModal
        onGasParametersChanged={(gasParameters) => walletService.setGasParameters(gasParameters)}
        hideModal={() => {
          walletService.disconnect();
          history.push('/selectDeployName');
        }}
        modalClassName="topup-modal-wrapper"
        topUpClassName="jarvis-styles"
        logoColor="black"
      />
    </div>
  );
}
