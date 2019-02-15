import 'jsdom-global/register';
import React from 'react';
import {configure, mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import Adapter from 'enzyme-adapter-react-16';
import ApproveConnection from '../../src/components/ApproveConnection';
import {createMockProvider, getWallets} from 'ethereum-waffle';
import {waitUntil} from 'universal-login-commons';


configure({adapter: new Adapter()});

describe('UI: <ApproveConnection />', () => {
  let wrapper;
  let identity;
  let sdk;
  let emitter;

  before(async () => {
    const provider = createMockProvider();
    const [wallet] = await getWallets(provider);
    identity = {name: 'name', address: wallet.address, privateKey: wallet.privateKey};
    sdk = {denyRequest: sinon.spy()};
    const identityService = {identity, privateKey: wallet.privateKey, cancelSubscription: sinon.fake.returns()};
    emitter = {emit: sinon.spy()};
    const services = {sdk, identityService, emitter};
    wrapper = mount(<ApproveConnection services={services} />);
  });

  it('ApproveConnectionView contains all texts', () => {
    expect(wrapper.text()).to.contains('Cancel request');
    expect(wrapper.text()).to.contains('Cancel request');
    expect(wrapper.text()).to.contains('Waiting for approval');
    expect(wrapper.contains(
      <p className="user-id">{identity.name}</p>
    )).to.be.true;
  });

  it('cancel button', async () => {
    await wrapper.find('button.cancel-btn').simulate('click');
    expect(sdk.denyRequest).to.have.been.called;
    const wasCalled = () =>  emitter.emit.lastCall && emitter.emit.lastCall.args.includes('Login');
    await waitUntil(wasCalled, 5, 10);
    expect(emitter.emit).to.have.been.calledWith('setView', 'Login');
  });

  it('account recovery button', async () => {
    wrapper.find('button.secondary-btn').simulate('click');
    expect(sdk.denyRequest).to.have.been.called;
    const wasCalled = () =>  emitter.emit.lastCall && emitter.emit.lastCall.args.includes('RecoverAccount');
    await waitUntil(wasCalled, 5, 10);
    expect(emitter.emit).to.have.been.calledWith('setView', 'RecoverAccount');
  });
});
