import React from 'react';
import {RadioButton} from './RadioButton';
import {GasMode, GasOption, getBalanceOf, TokenDetailsWithBalance, safeMultiply} from '@universal-login/commons';
import {utils} from 'ethers';
import {isDisabled} from '../../../core/utils/isDisabled';

interface TransactionFeeProps {
  gasModes: GasMode[];
  modeName: string;
  tokenAddress: string;
  gasLimit: utils.BigNumberish;
  usdAmount: utils.BigNumberish;
  tokensDetailsWithBalance?: TokenDetailsWithBalance[];
  onGasOptionChanged: (gasOption: GasOption) => void;
}

export const TransactionFeeChoose = ({gasModes, gasLimit, onGasOptionChanged, modeName, tokenAddress, tokensDetailsWithBalance, usdAmount}: TransactionFeeProps) => {
  const renderBalance = (option: GasOption) => tokensDetailsWithBalance ? (
    <div className="transaction-fee-balance">
      <p className="transaction-fee-balance-text">Your balance</p>
      <p className="transaction-fee-balance-amount">{getBalanceOf(option.token.symbol, tokensDetailsWithBalance)} {option.token.symbol}</p>
    </div>
  ) : null;

  return (
    <div className="transaction-fee">
      <p className="transaction-fee-title">Transaction fee</p>
      <ul className="transaction-fee-list">
        {gasModes.filter(gasMode => gasMode.name === modeName)[0].gasOptions.map((option: GasOption) => (
          <li key={option.token.address} className="transaction-fee-item">
            <RadioButton
              disabled={isDisabled(option.token.symbol)}
              id={`token-${option.token.address}`}
              name="fee"
              checked={option.token.address === tokenAddress}
              onClick={() => onGasOptionChanged(option)}
            >
              <div className="transaction-fee-row">
                <div className="transaction-fee-details">
                  <img src="" alt="" className="transaction-fee-item-icon" />
                  <div>
                    <p className="transaction-fee-amount">{safeMultiply(option.gasPrice, gasLimit)} {option.token.symbol}</p>
                    <p className="transaction-fee-amount-usd">{safeMultiply(utils.parseEther(usdAmount.toString()), gasLimit)} USD</p>
                  </div>
                </div>
                {renderBalance(option)}
              </div>
            </RadioButton>
          </li>
        ))}
      </ul>
    </div>
  );
};
