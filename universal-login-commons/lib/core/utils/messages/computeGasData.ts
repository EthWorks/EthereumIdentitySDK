import {ensure} from '../errors/heplers';
import {isProperHexString} from '../hexStrings';
import {utils} from 'ethers';

export const ZERO_BYTE_GAS_COST = 4;
export const NON_ZERO_BYTE_GAS_COST = 68;

export const computeGasData = (data: string) => {
  ensure(isProperHexString(data), Error, 'Not a valid hex string');

  return data
    .match(/.{2}/g)!
    .slice(1)
    .reduce((totalGasCost, byte) => totalGasCost + gasCostFor(byte), 0);
};

const gasCostFor = (byte: string) => {
  return byte === '00' ? ZERO_BYTE_GAS_COST : NON_ZERO_BYTE_GAS_COST;
};

export const GAS_FIXED = '40000';

export const computeGasBase = (data: string) => utils.bigNumberify(computeGasData(data)).add(GAS_FIXED);
