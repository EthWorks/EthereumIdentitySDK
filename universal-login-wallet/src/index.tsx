import './styles/style.sass';

import React from 'react';
import { render } from 'react-dom';
import App from './ui/App';
import Services from './services/Services';


const services = new Services({jsonRpcUrl: 'http://rinkeby.infura.io', relayerUrl: 'https://relayer.universallogin.io/'});

console.log(services);

render(
  <App />,
  document.getElementById('app'),
);
