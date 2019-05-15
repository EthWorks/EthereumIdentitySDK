import {utils} from 'ethers';

export type Procedure = (...args: any[]) => void;

export type Predicate = (...args: any[]) => boolean;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PartialRequired<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

export interface Message {
  gasToken: string;
  operationType: number;
  to: string;
  from: string;
  nonce: number | string;
  gasLimit: utils.BigNumberish;
  gasPrice: utils.BigNumberish;
  data: utils.Arrayish;
  value: utils.BigNumberish;
  signature: string;
}

export interface Notification {
  id: number;
  key: string;
  walletContractAddress: string;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  ipAddress: string;
  name: string;
  city: string;
  os: string;
  browser: string;
  time: string;
}
