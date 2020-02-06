import {RpcBridge} from './RpcBridge';
import {DEFAULT_CONFIG} from './config'
import {createIFrame} from './createIframe';

export class ULIFrameProvider {
  private iframe: HTMLIFrameElement;
  private bridge: RpcBridge;

  constructor(config = DEFAULT_CONFIG) {
    this.iframe = createIFrame(config.backendUrl);
    this.bridge = new RpcBridge(
      msg => this.iframe.contentWindow!.postMessage(msg, '*'),
      this.handleRpc.bind(this),
    );
    window.addEventListener('message', e => this.bridge.handleMessage(e.data));
  }

  private handleRpc(msg: any, cb: (error: any, response: any) => void) {

  }

  static create(config = DEFAULT_CONFIG) {
    return new ULIFrameProvider(config);
  }

  send(msg: any, cb: (error: any, response: any) => void) {
    this.bridge.send(msg, cb);
  }

  openDashboard() {
    this.send({method: 'ul_open_dashboard'}, () => {});
  }

  closeDashboard() {
    this.send({method: 'ul_close_dashboard'}, () => {});
  }
}

