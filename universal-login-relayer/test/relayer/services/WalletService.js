import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {utils} from 'ethers';
import {loadFixture} from 'ethereum-waffle';
import {MANAGEMENT_KEY, ACTION_KEY, calculateMessageSignature} from 'universal-login-contracts';
import basicWalletService, {transferMessage, addKeyMessage, removeKeyMessage} from '../../fixtures/basicWalletService';
import defaultDeviceInfo from '../../config/defaults';

chai.use(require('chai-string'));
chai.use(sinonChai);


describe('Relayer - WalletService', async () => {
  let identityService;
  let provider;
  let authorisationService;
  let wallet;
  let callback;
  let mockToken;
  let identity;
  let msg;
  let otherWallet;

  beforeEach(async () => {
    ({wallet, provider, identityService, callback, mockToken, authorisationService, identity, otherWallet} = await loadFixture(basicWalletService));
    msg = {...transferMessage, from: identity.address, gasToken: mockToken.address};
  });

  describe('Create', async () => {
    it('returns contract address', async () => {
      expect(identity.address).to.be.properAddress;
    });

    it('is initialized with management key', async () => {
      expect(await identity.keyExist(wallet.address)).to.eq(true);
    });

    it('has ENS name reserved', async () => {
      expect(await provider.resolveName('alex.mylogin.eth')).to.eq(identity.address);
    });

    it('should emit created event', async () => {
      const transaction = await identityService.create(wallet.address, 'example.mylogin.eth');
      expect(callback).to.be.calledWith(sinon.match(transaction));
    });

    it('should fail with not existing ENS name', async () => {
      const creationPromise = identityService.create(wallet.address, 'alex.non-existing-id.eth');
      await expect(creationPromise).to.be.eventually.rejectedWith('domain not existing / not universal ID compatible');
    });
  });

  describe('Execute signed', async () => {
    it('Error when not enough tokens', async () => {
      const message = {...msg, gasLimit: utils.parseEther('2.0')};
      const signature = calculateMessageSignature(wallet.privateKey, message);
      expect(identityService.executeSigned({...message, signature})).to.be.eventually.rejectedWith('Not enough tokens');
    });

    describe('Transfer', async () => {
      it('successful execution of transfer', async () => {
        const expectedBalance = (await provider.getBalance(msg.to)).add(msg.value);
        const signature = await calculateMessageSignature(wallet.privateKey, msg);
        await identityService.executeSigned({...msg, signature});
        expect(await provider.getBalance(msg.to)).to.eq(expectedBalance);
      });
    });

    describe('Add Key', async () => {
      it('execute add key', async () => {
        msg = {...addKeyMessage, from: identity.address, gasToken: mockToken.address, to: identity.address};
        const signature = await calculateMessageSignature(wallet.privateKey, msg);

        await identityService.executeSigned({...msg, signature});
        expect(await identity.getKeyPurpose(otherWallet.address)).to.eq(ACTION_KEY);
      });

      describe('Collaboration with Authorisation Service', async () => {
        it('should remove request from pending authorisations if addKey', async () => {
          const request = {identityAddress: identity.address, key: otherWallet.address, deviceInfo: defaultDeviceInfo};
          await authorisationService.addRequest(request);
          msg = {...addKeyMessage, from: identity.address, gasToken: mockToken.address, to: identity.address};
          const signature = await calculateMessageSignature(wallet.privateKey, msg);
          await identityService.executeSigned({...msg, signature});
          const authorisations = await authorisationService.getPendingAuthorisations(identity.address);
          expect(authorisations).to.deep.eq([]);
        });
      });
    });

    describe('Remove key ', async () => {
      beforeEach(async () => {
        const message =  {...addKeyMessage, from: identity.address, gasToken: mockToken.address, to: identity.address};
        const signature = await calculateMessageSignature(wallet.privateKey, message);

        await identityService.executeSigned({...message, signature});
      });

      it('should remove key', async () => {
        expect((await identity.getKeyPurpose(otherWallet.address))).to.eq(ACTION_KEY);
        const message =  {...removeKeyMessage, from: identity.address, gasToken: mockToken.address, to: identity.address};
        const signature = await calculateMessageSignature(wallet.privateKey, message);

        await identityService.executeSigned({...message, signature});
        expect((await identity.keyExist(otherWallet.address))).to.eq(false);
      });
    });
  });

  after(async () => {
    await authorisationService.database.delete().from('authorisations');
    authorisationService.database.destroy();
  });
});
