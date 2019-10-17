import React, {useContext} from 'react';
import vaultImage from './../../assets/illustrations/vault.png';
import vaultImage2x from './../../assets/illustrations/vault@2x.png';
import {useServices, useWalletConfig} from '../../hooks';
import {WalletSelector} from '@universal-login/react';
import {
  ETHER_NATIVE_TOKEN,
  GasParameters,
  INITIAL_GAS_PARAMETERS,
  WalletSuggestionAction
} from '@universal-login/commons';
import Modal from '../Modals/Modal';
import {Link} from 'react-router-dom';
import {TopUpModalProps, WalletModalContext} from '../../../core/entities/WalletModalContext';
import {hideTopUpModal} from '../../../core/utils/hideTopUpModal';

export const CreateAccount = () => {
  const modalService = useContext(WalletModalContext);
  const {sdk, walletService} = useServices();
  const walletConfig = useWalletConfig();

  const showWaitingModal = (transactionHash?: string) => modalService.showModal('waitingForDeploy', {transactionHash});

  const onCreateClick = async (name: string) => {
    let gasParameters = INITIAL_GAS_PARAMETERS;
    const {waitForBalance} = await walletService.createFutureWallet();
    const topUpProps: TopUpModalProps = {
      onGasParametersChanged: (parameters: GasParameters) => { gasParameters = parameters; },
      isDeployment: true,
      hideModal: () => hideTopUpModal(walletService, modalService)
    };
    modalService.showModal('topUpAccount', topUpProps);
    await waitForBalance();
    showWaitingModal();
    await walletService.deployFutureWallet(name, gasParameters.gasPrice.toString(), ETHER_NATIVE_TOKEN.address, showWaitingModal);
    modalService.showModal('transactionSuccess');
  };

  return (
    <div className="main-bg">
      <div className="box-wrapper">
        <div className="box create-account-box">
          <div className="box-header">
            <h1 className="box-title">Create account</h1>
          </div>
          <div className="box-content create-account-content">
            <img src={vaultImage} srcSet={vaultImage2x} alt="vault" className="create-account-img" />
            <div className="create-account-selector-block">
              <label htmlFor="loginInput" className="jarvis-input-label">Choose a username</label>
              <WalletSelector
                onCreateClick={onCreateClick}
                onConnectClick={() => {}}
                sdk={sdk}
                domains={walletConfig.domains}
                actions={[WalletSuggestionAction.create]}
                className="jarvis"
                placeholder="bob"
              />
            </div>
            <p className="info-text create-account-info-text">Your username is a human-readable address. Like Domain Name Service (DNS) allows website address to be facebook.com and not 66.220.144.0., Ethereum Name Service (ENS) enables your address to be johndole.xyz., and not Oxeefc.. 0843.</p>
            <Link to="/welcome" className="button-secondary create-account-cancel">Cancel</Link>
          </div>
        </div>
      </div>
      <Modal />
    </div>
  );
};
