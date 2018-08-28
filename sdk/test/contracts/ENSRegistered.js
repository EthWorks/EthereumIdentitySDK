import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ENSRegistered from '../../build/ENSRegistered';
import ENSBuilder from '../../lib/utils/ensBuilder';
import {createMockProvider, deployContract, getWallets, solidity} from 'ethereum-waffle';
import {utils} from 'ethers';

chai.use(chaiAsPromised);
chai.use(solidity);

const {expect} = chai;

const domain = 'mylogin.eth';
const label = 'alex';
const hashLabel = utils.keccak256(utils.toUtf8Bytes(label));
const node = utils.namehash(`${label}.${domain}`);

describe('Identity contract', async () => {
  let provider;
  let wallet;
  let ensBuilder;
  let identity;

  beforeEach(async () => {
    provider = createMockProvider();
    [wallet] = await getWallets(provider);
    ensBuilder = new ENSBuilder(wallet);
    provider = await ensBuilder.bootstrapWith('mylogin', 'eth');
    const registrar = ensBuilder.registrars[domain].address;
    const args = [hashLabel, node, ensBuilder.ens.address, registrar, ensBuilder.resolver.address];
    identity = await deployContract(wallet, ENSRegistered, args);
  });

  it('resolves to given address', async () => {
    expect(await provider.resolveName('alex.mylogin.eth')).to.eq(identity.address);
  });
});
