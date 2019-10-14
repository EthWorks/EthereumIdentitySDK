import React, {useState, useEffect} from 'react';
import {isValidCode, SECURITY_CODE_LENGTH, Notification, filterNotificationByCodePrefix, GasParameters, INITIAL_GAS_PARAMETERS} from '@universal-login/commons';
import {DeployedWallet} from '@universal-login/sdk';
import {EmojiPlaceholders} from './EmojiPlaceholders';
import {transactionDetails} from '../../core/constants/TransactionDetails';
import ProgressBar from '../commons/ProgressBar';
import {useProgressBar} from '../hooks/useProgressBar';
import {EmojiKeyboard} from './EmojiKeyboard';
import {EmojiPanelWithFakes} from './EmojiPanelWithFakes';
import {GasPrice} from '../commons/GasPrice';
import CheckmarkIcon from './../assets/icons/correct.svg';
import {FooterSection} from '../commons/FooterSection';

type InputModeType = 'keyboard' | 'panelWithFakes' | 'none';

const getInputModeFor = (addresses: string[], currentInputMode: InputModeType): InputModeType => {
  if (addresses.length > 1) {
    return 'keyboard';
  } else if (addresses.length === 1) {
    return 'panelWithFakes';
  }
  return currentInputMode;
};

interface EmojiFormProps {
  deployedWallet: DeployedWallet;
  onConnectionSuccess: () => void;
  onDenyRequests?: () => void;
  hideTitle?: () => void;
  className?: string;
}

export const EmojiForm = ({deployedWallet, hideTitle, className, onDenyRequests, onConnectionSuccess}: EmojiFormProps) => {
  const [enteredCode, setEnteredCode] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [inputMode, setInputMode] = useState<InputModeType>('none');
  const [addresses, setAddresses] = useState<string[]>([]);
  const {progressBar, showProgressBar} = useProgressBar();
  const [isInputValid, setIsInputValid] = useState(false);
  let gasParameters = INITIAL_GAS_PARAMETERS;

  useEffect(() => deployedWallet.subscribeAuthorisations((notifications: Notification[]) => {
    setNotifications(notifications);
    updateAddressesAndInputMode(notifications);
  }), []);

  const updateAddressesAndInputMode = (notifications: Notification[]) => {
    const addresses = filterNotificationByCodePrefix(notifications, enteredCode);
    setInputMode(getInputModeFor(addresses, inputMode));
    setAddresses(addresses);
  };

  const checkCode = () => {
    if (enteredCode.length !== SECURITY_CODE_LENGTH || addresses.length !== 1) {
      return false;
    }
    return isValidCode(enteredCode, addresses[0]);
  };

  const confirmCode = async (address: string) => {
    const {waitToBeSuccess} = await deployedWallet.addKey(address, {...transactionDetails, ...gasParameters});
    showProgressBar();
    await waitToBeSuccess();
    onConnectionSuccess();
  };

  const onEmojiAdd = (code: number) => {
    if (enteredCode.length < SECURITY_CODE_LENGTH) {
      enteredCode.push(code);
      setEnteredCode([...enteredCode]);
      updateAddressesAndInputMode(notifications);
    }
    if (checkCode()) {
      setIsInputValid(true);
      hideTitle ? hideTitle() : null;
    }
  };

  const onEmojiRemove = (index: number) => {
    if (enteredCode.length >= 0) {
      enteredCode.splice(index, 1);
      setEnteredCode([...enteredCode]);
    }
    updateAddressesAndInputMode(notifications);
  };

  const renderKeyboard = (inputMode: string) => {
    if (inputMode === 'none') {
      return null;
    } else if (inputMode === 'keyboard') {
      return <EmojiKeyboard onEmojiClick={onEmojiAdd} className={className} />;
    }
    return (
      <EmojiPanelWithFakes
        publicKey={addresses[0]}
        onEmojiClick={onEmojiAdd}
        className={className}
      />
    );
  };

  const onCancelClick = () => {
    deployedWallet.denyRequests();
    onDenyRequests ? onDenyRequests() : null;
  };

  const renderContent = () => {
    if (isInputValid) {
      return (
        <div className="correct-input">
          <img className="correct-input-img" src={CheckmarkIcon} alt="checkmark" />
          <p className="correct-input-title">Correct!</p>
          <EmojiPlaceholders
            enteredCode={enteredCode}
            onEmojiClick={onEmojiRemove}
            className={className}
          />
          <div className="correct-input-footer">
            <FooterSection className={className}>
              <GasPrice
                isDeployed={true}
                deployedWallet={deployedWallet}
                gasLimit={transactionDetails.gasLimit!}
                onGasParametersChanged={(parameters: GasParameters) => { gasParameters = parameters; }}
                className={className}
              />
              <div className="footer-buttons-row">
                <button onClick={onCancelClick} className="footer-cancel-btn">Cancel</button>
                <button onClick={() => confirmCode(addresses[0])} className="footer-approve-btn">Connect device</button>
              </div>
            </FooterSection>
          </div>
        </div>
      );
    }

    return (
      <div className="approve-device-form">
        <EmojiPlaceholders
          enteredCode={enteredCode}
          onEmojiClick={onEmojiRemove}
          className={className}
        />
        {renderKeyboard(inputMode)}
        <div className="emojis-form-reject-wrapper">
          <button
            className="emojis-form-reject"
            id="reject"
            onClick={onCancelClick}
          >
            Deny
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="emojis">
      {progressBar ? <Loader /> : renderContent()}
    </div>
  );
};

const Loader = () => (
  <div className="emoji-form-loader">
    <p className="emojis-form-title">Connecting new device...</p>
    <ProgressBar className="connection-progress-bar" />
  </div>
);
