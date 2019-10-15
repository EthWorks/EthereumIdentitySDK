import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import {TokenGrantingRelayer} from '../../../../lib/http/relayers/TokenGrantingRelayer';
import {utils, Contract} from 'ethers';
import {getWallets, createMockProvider, solidity} from 'ethereum-waffle';
import {waitUntil, stringifySignedMessageFields, DEFAULT_GAS_PRICE, DEFAULT_GAS_LIMIT} from '@universal-login/commons';
import {messageToSignedMessage} from '@universal-login/contracts';
import WalletContract from '@universal-login/contracts/build/Wallet.json';
import {startRelayer} from '../../../helpers/startRelayer';
import {WalletCreator} from '../../../helpers/WalletCreator';

chai.use(solidity);
chai.use(chaiHttp);

const addKey = async (contractAddress, publicKey, privateKey, tokenAddress, provider) => {
  const data = new utils.Interface(WalletContract.interface).functions['addKey'].encode([publicKey]);
  const message = {
    to: contractAddress,
    from: contractAddress,
    nonce: parseInt(await (new Contract(contractAddress, WalletContract.interface, provider)).lastNonce(), 10),
    data,
    gasToken: tokenAddress,
    gasPrice: DEFAULT_GAS_PRICE,
    gasLimit: DEFAULT_GAS_LIMIT
  };
  const signedMessage = messageToSignedMessage(message, privateKey);
  await chai.request('http://localhost:33511')
    .post('/wallet/execution')
    .send(stringifySignedMessageFields(signedMessage));
};

describe('INT: Token Granting Relayer', async () => {
  const provider = createMockProvider();
  const [wallet] = getWallets(provider);
  let relayer;
  let tokenContract;
  let privateKey;
  let contractAddress;

  beforeEach(async () => {
    ({relayer, tokenContract} = await startRelayer(wallet, TokenGrantingRelayer));
    const walletCreator = new WalletCreator(relayer, wallet);
    ({contractAddress, privateKey} = await walletCreator.deployWallet());
  });

  const isTokenBalanceGreater = (value) => async () =>
    (await tokenContract.balanceOf(contractAddress)).gt(utils.parseEther(value));

  const isTokenBalanceEqual = (value) => async () =>
    (await tokenContract.balanceOf(contractAddress)).eq(value);


  describe('Token granting', async () => {
    it('Grants 100 tokens on contract creation', async () => {
      await waitUntil(isTokenBalanceEqual(utils.parseEther('100')), 5, 1000);
    });

    it('Grants 5 tokens on key add', async () => {
      await addKey(contractAddress, wallet.address, privateKey, tokenContract.address, provider);
      await waitUntil(isTokenBalanceGreater('104'), 5, 500);
      const actualBalance = await tokenContract.balanceOf(contractAddress);
      expect(actualBalance).to.be.above(utils.parseEther('104'));
    });
  });

  afterEach(async () => {
    await relayer.stopLater();
  });
});
