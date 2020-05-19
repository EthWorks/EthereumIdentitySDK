import React, {useState, useEffect} from 'react';
import {TokensPrices} from '@unilogin/commons';
import UniLoginSdk from '@unilogin/sdk';
import Spinner from './Spinner';
import './../styles/base/assetsItem.sass';
import './../styles/themes/UniLogin/assetsItemThemeUnilogin.sass';
import './../styles/themes/Jarvis/assetsItemThemeJarvis.sass';
import './../styles/themes/Legacy/assetsItemThemeLegacy.sass';
import {getTildeGivenAmount, formatCurrency} from '../../core/utils/formatCurrency';
import {ThemedComponent} from './ThemedComponent';

export interface AssetProps {
  sdk: UniLoginSdk;
  name: string;
  symbol: string;
  balance: string | null;
  icon: string;
}

export const Asset = ({sdk, name, symbol, balance, icon}: AssetProps) => {
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [usdPrice, setUsdPrice] = useState<string>('');

  useEffect(() => {
    const unsubscribe = sdk.subscribeToPrices((tokensPrices: TokensPrices) => {
      const tokenPrice = tokensPrices[symbol] === undefined ? 0 : tokensPrices[symbol]['USD'];
      setUsdPrice(tokenPrice.toString());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const tokenValue = Number(usdPrice) * Number(balance);
    setUsdAmount(tokenValue.toString());
  }, [usdPrice, balance]);

  return (
    <ThemedComponent key={name} name="assets-item">
      <div className="assets-item-row">
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
    </ThemedComponent>
  );
};
