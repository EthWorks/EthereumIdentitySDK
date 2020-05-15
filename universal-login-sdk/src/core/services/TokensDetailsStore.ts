import {TokenDetails, TokenDetailsService, ensureNotFalsy} from '@unilogin/commons';
import {TokenNotFound} from '../utils/errors';

export class TokensDetailsStore {
  tokensDetails: TokenDetails[] = [];

  constructor(private tokenDetailsService: TokenDetailsService, private tokensAddresses: string[]) {}

  async fetchTokensDetails() {
    if (this.tokensDetails.length === 0) {
      this.tokensDetails = await this.tokenDetailsService.getTokensDetails(this.tokensAddresses);
    }
  }

  getTokenAddress(symbol: string) {
    const token = this.tokensDetails.find((token) => token.symbol === symbol);
    return token ? token.address : undefined;
  }

  getTokenByAddress(address: string): TokenDetails {
    const token = this.tokensDetails.find((token) => token.address === address);
    ensureNotFalsy(token, TokenNotFound, address);
    return token!;
  }

  getTokenBySymbol(symbol: string): TokenDetails | undefined {
    const token = this.tokensDetails.find((token) => token.symbol === symbol);
    return token || undefined;
  }
}
