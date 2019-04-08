import UniversalLoginSDK from '@universal-login/sdk';
import WalletService from './WalletService';
import {utils} from 'ethers';
import IERC20 from 'openzeppelin-solidity/build/contracts/IERC20.json';
import TokenService from './TokenService';
import {ETHER_NATIVE_TOKEN} from '@universal-login/commons';

export interface TransferDetails {
  to: string;
  amount: string;
  currency: string;
}

class TransferService {
  constructor(private sdk: UniversalLoginSDK, private walletService: WalletService, private tokenService: TokenService) {}

  async transfer(transferDetails: TransferDetails) {
    if (transferDetails.currency === ETHER_NATIVE_TOKEN.symbol) {
      await this.transferEther(transferDetails);
    } else {
      await this.transferTokens(transferDetails);
    }
  }

  async transferTokens({to, amount, currency} : TransferDetails) {
    const tokenAddress = this.tokenService.getTokenAddress(currency);
    if (this.walletService.userWallet) {
      const data = new utils.Interface(IERC20.abi).functions.transfer.encode([to, utils.parseEther(amount)]);
      const message = {
        from: this.walletService.userWallet.contractAddress,
        to: tokenAddress,
        value: 0,
        data,
        gasToken: tokenAddress
      };
      await this.sdk.execute(message, this.walletService.userWallet.privateKey);
    }
  }

  async transferEther({to, amount} : TransferDetails) {
    if (this.walletService.userWallet) {
      const message = {
        from: this.walletService.userWallet.contractAddress,
        to,
        value: utils.parseEther(amount),
        data: '0x0',
        gasToken: ETHER_NATIVE_TOKEN.address
      };
      await this.sdk.execute(message, this.walletService.userWallet.privateKey);
    }
  }
}

export default TransferService;
