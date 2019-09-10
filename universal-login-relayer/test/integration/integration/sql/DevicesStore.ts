import {expect} from 'chai';
import {DevicesStore} from '../../../../lib/integration/sql/services/DevicesStore';
import {TEST_CONTRACT_ADDRESS, TEST_ACCOUNT_ADDRESS} from '@universal-login/commons';

describe('INT: DevicesStore', () => {
  let devicesStore: DevicesStore;
  const device1 = {
    os: 'Mac',
    name: 'laptop',
    city: 'Warsaw, Poland',
    ipAddress: '84.10.249.134',
    time: '18 minutes ago',
    browser: 'Safari'
  };
  const device2 = {
    os: 'iPhone',
    name: 'phone',
    city: 'Warsaw, Poland',
    ipAddress: '84.10.249.134',
    time: '18 minutes ago',
    browser: 'Safari'
  };

  beforeEach(() => {
    devicesStore = new DevicesStore();
  });

  it('initially empty', () => {
    const devices = devicesStore.get(TEST_CONTRACT_ADDRESS);
    expect(devices).to.be.deep.eq([]);
  });

  it('add to store 1 element', () => {
    devicesStore.add(TEST_CONTRACT_ADDRESS, TEST_ACCOUNT_ADDRESS, device1);
    const devices = devicesStore.get(TEST_CONTRACT_ADDRESS);
    expect(devices).to.be.deep.eq([device1]);
    const devices2 = devicesStore.get(TEST_ACCOUNT_ADDRESS);
    expect(devices2).to.be.deep.eq([]);
  });

  it('add to store 2 elements', () => {
    devicesStore.add(TEST_CONTRACT_ADDRESS, TEST_ACCOUNT_ADDRESS, device1);
    devicesStore.add(TEST_CONTRACT_ADDRESS, TEST_ACCOUNT_ADDRESS, device2);
    const devices = devicesStore.get(TEST_CONTRACT_ADDRESS);
    expect(devices).to.be.deep.eq([device1, device2]);
  });
});
