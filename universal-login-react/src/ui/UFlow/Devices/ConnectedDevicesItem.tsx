import React, {useState} from 'react';
import {utils} from 'ethers';
import {Device} from '@universal-login/commons';
import {DeployedWallet} from '@universal-login/sdk';
import {transactionDetails} from '../../../core/constants/TransactionDetails';
import {Logo} from './Logo';

export interface ConnectedDevicesItemProps extends Device {
  devicesAmount: number;
  deployedWallet: DeployedWallet;
  confirmationsCount: string;
}

export const ConnectedDevicesItem = ({devicesAmount, deviceInfo, publicKey, deployedWallet, confirmationsCount}: ConnectedDevicesItemProps) => {
  const {os, applicationName, type, ipAddress, city, logo} = deviceInfo;
  const [toBeRemoved, setToBeRemoved] = useState(false);
  const confirmationsAmount = Number(confirmationsCount);
  const [isWarningVisible, setIsWarningVisible] = useState(false);

  const showWarningMessage = () => {
    setIsWarningVisible(true);
    setTimeout(() => {
      setIsWarningVisible(false);
    }, 3000);
  };

  const onTrashButtonClick = () => {
    if (confirmationsAmount < devicesAmount) {
      setToBeRemoved(true);
    } else {
      showWarningMessage();
    }
  };

  const isCurrentDevice = () => utils.computeAddress(deployedWallet.privateKey) === publicKey;

  const renderTrashButton = () => (
    !isCurrentDevice && (
      <div className="connected-devices-trash-btn-wrapper">
        {isWarningVisible && <WarningMessage devicesAmount={devicesAmount} />}
        <button onClick={onTrashButtonClick} className="connected-devices-trash-btn" />
      </div>
    )
  );

  const renderConfirmationButtons = () => (
    <div className="connected-devices-buttons">
      <button onClick={() => setToBeRemoved(false)} className="connected-devices-cancel">Cancel</button>
      <button onClick={() => deployedWallet.removeKey(publicKey, transactionDetails)} className="connected-devices-delete">Delete</button>
    </div>
  );

  return (
    <li className={`connected-devices-item ${type.toLowerCase()} ${toBeRemoved ? 'highlighted' : ''}`}>
      <Logo logo={logo} applicationName={applicationName} />
      <div>
        <p className="connected-devices-type">{applicationName} &bull; {os}</p>
        <p className="connected-devices-details">
          IP address {ipAddress} {' '}{city}
        </p>
      </div>
      {toBeRemoved ? renderConfirmationButtons() : renderTrashButton()}
    </li >
  );
};

export interface WarningMessageProps {
  devicesAmount: number;
}

const WarningMessage = ({devicesAmount}: WarningMessageProps) => <p className="warning-message">You cannot disconnect because you have {devicesAmount}-devices confirmation</p>;
