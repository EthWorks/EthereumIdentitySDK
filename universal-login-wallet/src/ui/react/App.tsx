import React, {useLayoutEffect, useState} from 'react';
import {Route, Switch} from 'react-router-dom';
import {createModalService, useProperty} from '@universal-login/react';
import HomeScreen from './Home/HomeScreen';
import TransferringFundsScreen from './Login/TransferringFundsScreen';
import NotFound from './NotFound';
import {PrivateRoute} from './PrivateRoute';
import RecoveryScreen from './Login/RecoveryScreen';
import {useServices} from '../hooks';
import {WelcomeScreen} from './Home/WelcomeScreen';
import {TermsAndConditionsScreen} from './Home/TermsAndConditionsScreen';
import {CreateAccount} from './CreateAccount/CreateAccount';
import {ConnectAccount} from './ConnectAccount/ConnectAccount';
import {WalletModalContext, WalletModalType, WalletModalPropType} from '../../core/entities/WalletModalContext';

const App = () => {
  const modalService = createModalService<WalletModalType, WalletModalPropType>();
  const {walletService} = useServices();
  const [appReady, setAppReady] = useState(false);

  useLayoutEffect(() => {
    if (walletService.state.kind === 'None') {
      walletService.loadFromStorage();
    }
    setAppReady(true);
  }, []);

  const authorized = useProperty(walletService.isAuthorized);

  if (!appReady) {
    return null;
  }

  return (
    <WalletModalContext.Provider value={modalService}>
      <Switch>
        <Route
          exact
          path="/welcome"
          render={() => <WelcomeScreen />}
        />
        <Route
          exact
          path="/terms"
          render={() => <TermsAndConditionsScreen />}
        />
        <Route
          exact
          path="/create"
          render={() => <CreateAccount />}
        />
        <Route
          exact
          path="/connect"
          render={() =>
            <div className="main-bg">
              <div className="box-wrapper">
                <div className="box">
                  <ConnectAccount />
                </div>
              </div>
            </div>}
        />
        <Route
          exact
          path="/recovery"
          render={() => <RecoveryScreen />}
        />
        <PrivateRoute
          authorized={authorized}
          exact
          path="/"
          render={() => <HomeScreen />}
        />
        <PrivateRoute
          path="/transferring"
          authorized={authorized}
          render={() => <TransferringFundsScreen />}
        />
        <Route component={NotFound} />
      </Switch>
    </WalletModalContext.Provider>
  );
};

export default App;
