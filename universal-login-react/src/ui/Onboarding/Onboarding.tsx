import React from 'react';
import {WalletService} from '@unilogin/sdk';
import {WalletSelector} from '../WalletSelector/WalletSelector';
import {ApplicationWallet, WalletSuggestionAction} from '@unilogin/commons';
import {ConnectionFlow, ModalWrapper} from '../..';
import {OnboardingSteps} from './OnboardingSteps';
import {Route, MemoryRouter} from 'react-router-dom';
import {Switch} from 'react-router';
import {getInitialOnboardingLocation} from '../../app/getInitialOnboardingLocation';
import {OnboardingStepsWrapper} from './OnboardingStepsWrapper';
import '../styles/themes/Legacy/connectionFlowModalThemeLegacy.sass';

export interface OnboardingProps {
  walletService: WalletService;
  domains: string[];
  onConnect?: () => void;
  onCreate?: (arg: ApplicationWallet) => void;
  hideModal?: () => void;
  className?: string;
  modalClassName?: string;
}

export const Onboarding = (props: OnboardingProps) => {
  const onSuccess = () => props.onConnect?.();

  return (
    <div className="universal-login">
      <MemoryRouter initialEntries={[getInitialOnboardingLocation(props.walletService.state)]}>
        <Switch>
          <Route
            exact
            path="/selector"
            render={({history}) =>
              <OnboardingStepsWrapper
                hideModal={props.hideModal}
                message={props.walletService.sdk.getNotice()}
                steps={4}
                progress={1}>
                <div className="perspective">
                  <WalletSelector
                    sdk={props.walletService.sdk}
                    onCreateClick={async (ensName) => {
                      if (props.walletService.sdk.isRefundPaid()) {
                        await props.walletService.createWallet(ensName);
                      }
                      history.push('/create', {ensName});
                    }}
                    onConnectClick={(ensName) => history.push('/connectFlow/chooseMethod', {ensName})}
                    domains={props.domains}
                    actions={[WalletSuggestionAction.connect, WalletSuggestionAction.create]}
                  />
                </div>
              </OnboardingStepsWrapper>}
          />
          <Route
            exact
            path="/create"
            render={({location}) =>
              <OnboardingSteps
                walletService={props.walletService}
                onCreate={props.onCreate}
                ensName={location.state.ensName}
              />}
          />
          <Route
            path="/connectFlow"
            render={({history, location}) =>
              <ModalWrapper message={props.walletService.sdk.getNotice()} hideModal={() => history.push('/selector')}>
                <ConnectionFlow
                  basePath="/connectFlow"
                  onCancel={() => history.push('/selector')}
                  name={location.state.ensName}
                  walletService={props.walletService}
                  onSuccess={onSuccess}
                />
              </ModalWrapper>}
          />
        </Switch>
      </MemoryRouter>
    </div>
  );
};
