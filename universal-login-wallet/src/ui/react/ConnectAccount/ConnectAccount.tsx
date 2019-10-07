import React, {useState} from 'react';
import {ConnectSelector} from './ConnectSelector';
import {ConnectWithPassphrase} from './ConnectWithPassphrase';
import {ConnectWithEmoji} from './ConnectWithEmoji';
import {useServices, useRouter} from '../../hooks';
import {ChooseConnectionScreen} from './ChooseConnectionScreen';

export type ConnectModal = 'connectionMethod' | 'selector' | 'recover' | 'emoji';

export const ConnectAccount = () => {
  const {history} = useRouter();
  const {sdk, walletService} = useServices();
  const [name, setName] = useState<string | undefined>(undefined);
  const [connectModal, setConnectModal] = useState<ConnectModal>('selector');
  if (connectModal === 'connectionMethod') {
    return (
      <ChooseConnectionScreen
        onConnectWithDeviceClick={() => setConnectModal('emoji')}
        onConnectWithPassphraseClick={() => setConnectModal('recover')}
        onCancel={() => setConnectModal('selector')}
      />
    );
  } else if (connectModal === 'recover') {
    return <ConnectWithPassphrase name={name!} />;
  } else if (connectModal === 'emoji') {
    return (
      <ConnectWithEmoji
        name={name!}
        sdk={sdk}
        walletService={walletService}
        onConnect={() => history.push('/')}
        onCancel={() => setConnectModal('connectionMethod')}
      />
    );
  } else {
    return <ConnectSelector setName={setName} setConnectModal={setConnectModal} />;
  }
};
