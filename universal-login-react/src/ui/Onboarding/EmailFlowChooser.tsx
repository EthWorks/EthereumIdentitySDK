import React, {useState} from 'react';
import {useClassFor, classForComponent} from '../utils/classFor';
import '../styles/base/onboardingSelectFlow.sass';
import '../styles/themes/UniLogin/onboardingSelectFlowThemeUniLogin.sass';
import {InputField} from '../commons/InputField';

export interface EmailFlowChooserProps {
  onCreateClick: (email: string, ensName: string) => void;
  onConnectClick: (emailOrEnsName: string) => void;
}

export const EmailFlowChooser = ({onCreateClick, onConnectClick}: EmailFlowChooserProps) => {
  const [email, setEmail] = useState('');
  const [ensName, setEnsName] = useState('');
  const [emailOrEnsName, setEmailOrEnsName] = useState('');
  const [flow, setFlow] = useState<'create' | 'connect'>('create');

  const handleClick = () => flow === 'connect'
    ? onConnectClick(emailOrEnsName)
    : onCreateClick(email, ensName);

  return (
    <div className={useClassFor('select-flow')}>
      <div className={useClassFor('flow-wrapper')}>
        <div className={useClassFor('user-tabs')}>
          <button
            onClick={() => setFlow('create')}
            className={`${classForComponent('user-tab')} ${flow === 'create' ? 'active' : ''}`}>New user</button>
          <button
            onClick={() => setFlow('connect')}
            className={`${classForComponent('user-tab')} ${flow === 'connect' ? 'active' : ''}`}>Existing user</button>
        </div>
        <div className={useClassFor('flow-content')}>
          {flow === 'create' && <CreationContent email={email} setEmail={setEmail} ensName={ensName} setEnsName={setEnsName} />}
          {flow === 'connect' && <InputField
            id='email-or-ens-name-input'
            value={emailOrEnsName}
            setValue={setEmailOrEnsName}
            label='Type a username or e-mail to search'
          />}
        </div>
      </div>
      <button onClick={handleClick} className={classForComponent('confirm-btn')}>Confirm</button>
    </div >
  );
};

interface CreationContentProps {
  email: string;
  setEmail: (email: string) => void;
  ensName: string;
  setEnsName: (ensName: string) => void;
}

const CreationContent = ({email, setEmail, ensName, setEnsName}: CreationContentProps) =>
  <>
    <InputField
      id='ens-name-input'
      label='Type a username you want'
      setValue={setEnsName}
      value={ensName}
    />
    <p className={`${useClassFor('input-description')} ${classForComponent('username-suggestion')}`}>our suggestion: <b>satoshi93.unilogin.eth</b></p>
    <InputField
      id='email-input'
      label='Your e-mail'
      setValue={setEmail}
      value={email}
      description='We will use your email and password to help you recover your account. We do not hold custody of your funds. If you’d rather not share an email'
    />
  </>;
