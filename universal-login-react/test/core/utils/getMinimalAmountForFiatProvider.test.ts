import {expect} from 'chai';
import sinon from 'sinon';
import {getMinimalAmountForFiatProvider, getMinimalAmount} from '../../../src/core/utils/getMinimalAmountForFiatProvider';
import {TopUpProvider} from '../../../src/core/models/TopUpProvider';
import {InvalidWalletState} from '@unilogin/sdk';
import {TokenPricesService} from '@unilogin/commons';

describe('getMinimalAmountForFiatProvider', () => {
  describe('RAMP provider', () => {
    const paymentMethod = TopUpProvider.RAMP;
    const tokenPricesService = new TokenPricesService();

    before(() => {
      sinon.stub(tokenPricesService, 'getEtherPriceInCurrency').resolves('1');
    });

    it('return provider minimal amount', async () => {
      const bigMinimalAmount = '2';
      expect(await getMinimalAmountForFiatProvider(paymentMethod, bigMinimalAmount, tokenPricesService)).to.eq('2');
    });

    it('return UniversalLogin minimal amount', async () => {
      const smallMinimalAmount = '0.0001';
      expect(await getMinimalAmountForFiatProvider(paymentMethod, smallMinimalAmount, tokenPricesService)).to.eq('1');
    });
    after(() => {
      sinon.restore();
    });
  });
});

describe('UNIT: getMinimalAmount', () => {
  const tokenPricesService = new TokenPricesService();

  before(() => {
    sinon.stub(tokenPricesService, 'getEtherPriceInCurrency').resolves('1');
  });

  it('returns 2 for Ramp and future wallet', async () => {
    const walletService = {
      getRequiredDeploymentBalance: () => '2',
    };
    const paymentMethod = TopUpProvider.RAMP;
    expect(await getMinimalAmount(walletService as any, paymentMethod, tokenPricesService)).to.eq('2');
  });

  it('returns 30 for Safello and future wallet', async () => {
    const walletService = {
      getRequiredDeploymentBalance: () => '2',
    };
    const paymentMethod = TopUpProvider.SAFELLO;
    expect(await getMinimalAmount(walletService as any, paymentMethod, tokenPricesService)).to.eq('30');
  });

  it('returns 30 for Safello and deployed wallet', async () => {
    const walletService = {
      getRequiredDeploymentBalance: () => {
        throw new InvalidWalletState('Future', 'Deployed');
      },
    };
    const paymentMethod = TopUpProvider.SAFELLO;
    expect(await getMinimalAmount(walletService as any, paymentMethod, tokenPricesService)).to.eq('30');
  });

  it('returns 1 for Ramp and deployed wallet', async () => {
    const walletService = {
      getRequiredDeploymentBalance: () => {
        throw new InvalidWalletState('Future', 'Deployed');
      },
    };
    const paymentMethod = TopUpProvider.RAMP;
    expect(await getMinimalAmount(walletService as any, paymentMethod, tokenPricesService)).to.eq('1');
  });

  after(() => {
    sinon.restore();
  });
});
