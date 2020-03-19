import React, {useState, useEffect} from 'react';
import {TokensPrices} from '@unilogin/commons';
import UniversalLoginSDK from '@unilogin/sdk';
import Spinner from './Spinner';
import {getStyleForTopLevelComponent} from '../../core/utils/getStyleForTopLevelComponent';
import './../styles/assetsItem.sass';
import './../styles/assetsItemDefault.sass';
import {getTildeGivenAmount, formatCurrency} from '../../core/utils/formatCurrency';

export interface AssetProps {
  sdk: UniversalLoginSDK;
  name: string;
  symbol: string;
  balance: string | null;
  icon: string;
  className?: string;
}

export const Asset = ({sdk, name, symbol, balance, icon, className}: AssetProps) => {
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [usdPrice, setUsdPrice] = useState<string>('');

  useEffect(() => {
    const unsubscribe = sdk.subscribeToPrices((tokensPrices: TokensPrices) => {
      console.log('symbol', symbol)
      const tokenPrice = tokensPrices[symbol] === undefined ? 0 : tokensPrices[symbol]['USD'];
      console.log('tokenPrice', tokenPrice)
      setUsdPrice(tokenPrice.toString());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const tokenValue = Number(usdPrice) * Number(balance);
    setUsdAmount(tokenValue.toString());
  }, [usdPrice, balance]);

  return (
    <div key={name} className="universal-login-assets-item">
      <div className={getStyleForTopLevelComponent(className)}>
        <div className="assets-item">
          <div className="assets-item-left">
            <div className="assets-img-wrapper">
              <img src={icon} alt={symbol} className="currency-accordion-img" />
            </div>
            <div>
              <p className="assets-name">{name}</p>
              <p className="assets-price">1 {symbol} = ${usdPrice}</p>
            </div>
          </div>
          <div className="assets-item-right">
            {balance ? <p className="assets-balance"> {balance} {symbol}</p> : <Spinner/>}
            <div className="assets-balance-converted">
              <p className="assets-price-tilde">{getTildeGivenAmount(usdAmount)}</p>
              {balance ? <p className="assets-price">{formatCurrency(usdAmount)}</p> : ''}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
