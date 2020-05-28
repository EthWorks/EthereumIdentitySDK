import React, {useState, useEffect} from 'react';
import styled from 'styled-components';
import {utils} from 'ethers';
import {GasMode, GasModesWithPrices, findGasMode, findGasOption, GasOption, EMPTY_GAS_OPTION, FAST_GAS_MODE_INDEX, ETHER_NATIVE_TOKEN, ensureNotFalsy, ensureNotNullish, Message} from '@unilogin/commons';
import {ModalWrapper, useAsync, Spinner} from '@unilogin/react';
import {WalletService, TransferService, getValueInUsd} from '@unilogin/sdk';
import {Title} from '../common/Text/Title';
import {Text} from '../common/Text/Text';
import {CloseButton} from '../common/Button/CloseButton';
import {TransactionSpeed} from './TransactionSpeed';
import {TransactionFee} from './TransactionFee';
import {ButtonPrimary, ButtonSecondary} from '../common/Button/Button';
import {UniLoginLogo} from '../common/UniLoginLogo';
import {GlobalStyle} from '../common/GlobalStyle';
import {BoxHeader} from '../common/Layout/BoxHeader';
import {BoxContent} from '../common/Layout/BoxContent';
import {BoxFooter} from '../common/Layout/BoxFooter';
import {Box} from '../common/Layout/Box';
import {Row} from '../common/Layout/Row';
import {ConfirmationResponse} from '../../../models/ConfirmationResponse';

export interface ConfirmationTransactionProps {
  title: string;
  message: string;
  onConfirmationResponse: (response: ConfirmationResponse) => void;
  walletService: WalletService;
  transaction: Pick<Message, 'to' | 'value' | 'gasLimit' | 'data'>;
  onError?: (errorMessage: string) => void;
}

export const TransactionConfirmation = ({onConfirmationResponse, title, message, walletService, transaction, onError}: ConfirmationTransactionProps) => {
  ensureNotNullish(transaction.value, Error, 'Missing parameter of Transaction: value');
  ensureNotFalsy(transaction.gasLimit, Error, 'Missing parameter of Transaction: gasLimit');
  ensureNotFalsy(transaction.to, Error, 'Missing parameter of Transaction: to');
  const [modesAndPrices, error] = useAsync<GasModesWithPrices>(() => walletService.sdk.gasModeService.getModesWithPrices(), []);
  const [mode, setMode] = useState<Pick<GasMode, 'name' | 'usdAmount' | 'timeEstimation'>>({name: '', usdAmount: '0', timeEstimation: 0});
  const transferService = new TransferService(walletService.getDeployedWallet());
  const [transferDetails] = useAsync<{currencySymbol: string, targetAddress: string, value: string} | undefined | any>(() => transferService.getTransferDetails(transaction) as any, []);
  const [gasOption, setGasOption] = useState<GasOption>(EMPTY_GAS_OPTION);

  const [valueInUSD] = useAsync<any>(async () =>
    getValueInUsd(transferDetails.tokenAddress, walletService, transferDetails.value),
  [transferDetails]);

  const onModeChanged = (name: string) => {
    const gasTokenAddress = gasOption.token.address;
    const {usdAmount, gasOptions, timeEstimation} = findGasMode(modesAndPrices?.modes!, name);

    setMode({name, usdAmount, timeEstimation});
    setGasOption(findGasOption(gasOptions, gasTokenAddress));
  };

  useEffect(() => {
    if (modesAndPrices) {
      const {name, usdAmount, timeEstimation} = modesAndPrices.modes[FAST_GAS_MODE_INDEX];
      const gasOption = findGasOption(modesAndPrices.modes[FAST_GAS_MODE_INDEX].gasOptions, ETHER_NATIVE_TOKEN.address);
      setMode({name, usdAmount, timeEstimation});
      setGasOption(gasOption);
    }
  }, [modesAndPrices]);

  if (error) {
    if (onError) {
      onError(error.message);
    } else {
      console.error(error);
    }
  }

  if (!modesAndPrices) {
    return <Spinner className="spinner-center" />;
  }

  return <>
    <GlobalStyle />
    <ModalWrapper message={message}>
      <Box>
        <BoxHeader>
          <UniLoginLogo />
          <CloseButton onClick={() => onConfirmationResponse({isConfirmed: false})} />
        </BoxHeader>
        <BoxContent>
          <Title className="confirmation-title">{title}</Title>
          <TransactionData>
            <Row>
              <DataLabel>Send to:</DataLabel>
              <Address>{transferDetails && transferDetails.targetAddress}</Address>
            </Row>
            <Row>
              <DataLabel>Value:</DataLabel>
              <ValueRow>
                <Highlighted>
                  <Value>{transferDetails && utils.formatEther(transferDetails.value)} {transferDetails && transferDetails.tokenDetails.symbol}</Value>
                </Highlighted>
                <Value>{valueInUSD} USD</Value>
              </ValueRow>
            </Row>
            <Row>
              <DataLabel>Speed:</DataLabel>
              <TransactionSpeed gasModes={modesAndPrices.modes} selectedValue={mode.name} onChange={onModeChanged} />
            </Row>
            <Row>
              <DataLabel>Fee:</DataLabel>
              <TransactionFee mode={mode} gasLimit={transaction.gasLimit} gasOption={gasOption} deployedWallet={walletService.getDeployedWallet()} />
            </Row>
          </TransactionData>
        </BoxContent>
        <BoxFooter>
          <ButtonSecondary onClick={() => onConfirmationResponse({isConfirmed: false})}>Back</ButtonSecondary>
          <ButtonPrimary onClick={() => onConfirmationResponse({
            isConfirmed: true,
            gasParameters: {
              gasPrice: gasOption.gasPrice,
              gasToken: gasOption.token.address,
            },
          })}>Confirm</ButtonPrimary>
        </BoxFooter>
      </Box>
    </ModalWrapper>
  </>;
};

const TransactionData = styled.div`
    margin-top: 45px;

  @media(max-width: 600px) {
        margin - top: 24px;
    }
  `;

const DataLabel = styled(Text)`
    line-height: 17px;
    width: 100px;

  @media(max-width: 600px) {
        width: auto;
      margin-bottom: 4px;
    }
  `;

const Address = styled.p`
    margin: 0;
    font-size: 14px;
    line-height: 17px;
    display: flex;
    align-items: center;
    color: #0F0C4A;
  `;

const ValueRow = styled.div`
    display: flex;
    align-items: center;
  `;

const Value = styled(Text)`
    line-height: 17px;
  `;

const Highlighted = styled.div`
    padding: 4px 8px;
    background: #E8F9FE;
    margin-right: 24px;
    border-radius: 4px;

  & ${Value} {
        color: #0F0C4A;
      font-weight: 500;
    }
  `;
