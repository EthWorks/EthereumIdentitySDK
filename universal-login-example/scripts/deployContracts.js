import config from '../config/config';
import {getWallets, deployContract} from 'ethereum-waffle';
import ethers from 'ethers';
import fs from 'fs';
import Clicker from '../build/Clicker';

const {jsonRpcUrl} = config;

/* eslint-disable no-console */
class ContractsDelpoyer {

  save(filename, _variables) {
    const variables = Object.entries(_variables)
      .map(([key, value]) => `  ${key}='${value}'`)
      .join('\n');
    fs.writeFile(filename, variables, (err) => {
      if (err) {
        return console.error(err);
      }
      console.log(`${filename} file updated.`);
    });
  }

  async main() {
    this.provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
    this.wallets = await getWallets(this.provider);
    this.deployer = this.wallets[this.wallets.length - 1];
    const contract = await deployContract(this.deployer, Clicker);
    const variables = {};
    variables.CLICKER_CONTRACT_ADDRESS = contract.address;
    this.save('./.env', variables);
  }
}

const prepare = new ContractsDelpoyer();
prepare.main();