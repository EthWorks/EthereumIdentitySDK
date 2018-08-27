import config from '../config/relayer';
import {getWallets} from 'ethereum-waffle';
import ethers, {utils} from 'ethers';
import fs from 'fs';
import ENSBuilder from '../lib/utils/ensBuilder';

const {jsonRpcUrl, ensRegistrars} = config;



/* eslint-disable no-console */
class ENSDeployer {
  constructor() {
    this.variables = {};
    this.count = 1;
  }

  save(filename) {
    const content = Object.entries(this.variables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    fs.writeFile(filename, content, (err) => {
      if (err) {
        return console.error(err);
      }
      console.log(`${filename} file updated.`);
    });
  }

  async deployDomains() {
    const builder = new ENSBuilder(this.deployer);
    await builder.bootstrapENS();
    this.variables.ENS_ADDRESS = builder.ens.address;
    await builder.registerTLD('eth');
    for (const domain of Object.keys(ensRegistrars)) {
      const [label, tld] = domain.split('.');
      await builder.registerDomain(label, tld);
      this.variables[`ENS_REGISTRAR${this.count}`] = builder.registrars['mylogin.eth'].address;
      this.count += 1;
    }
  }

  async deploy() {
    this.provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
    this.wallets = await getWallets(this.provider);
    this.deployer = this.wallets[this.wallets.length - 1];
    console.log(`Deploying from: ${this.deployer.address}`);
    await this.deployDomains();
    this.save('.env');
  }
}

const prepare = new ENSDeployer();
prepare.deploy();
