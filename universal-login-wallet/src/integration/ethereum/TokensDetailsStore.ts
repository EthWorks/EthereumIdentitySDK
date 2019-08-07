import {TokenDetails, TokenDetailsService} from '@universal-login/commons';

class TokensDetailsStore {
  tokensDetails: TokenDetails[] = [];

  constructor(private tokenDetailsService: TokenDetailsService, private tokensAddresses: string[]) {}

  async aggregateTokensDetails() {
    for (const address of this.tokensAddresses) {
      const details = await this.tokenDetailsService.getTokenDetails(address);
      this.tokensDetails.push(details);
    }
  }

  getTokenAddress(symbol: string) {
    const token = this.tokensDetails.find(token => token.symbol === symbol);
    return token ? token.address : undefined;
  }
}

export default TokensDetailsStore;
