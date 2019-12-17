import {utils, Wallet} from 'ethers';
import {UnsignedMessage} from '../../models/message';
import {signHexString} from '../signatures';
import {DeployArgs} from '../../models/deploy';

export const calculateDeployHash = (msg: DeployArgs) => {
  return utils.solidityKeccak256(
    ['string', 'string', 'string', 'string', 'string'],
    [msg.publicKey, msg.ensName, msg.gasPrice, msg.gasToken, msg.signature]);
};

export const calculateMessageHash = (msg: UnsignedMessage) => {
  const dataHash = utils.solidityKeccak256(['bytes'], [msg.data]);
  return utils.solidityKeccak256(
    ['address', 'address', 'uint256', 'bytes32', 'uint256', 'uint', 'address', 'uint', 'uint'],
    [msg.from, msg.to, msg.value, dataHash, msg.nonce, msg.gasPrice, msg.gasToken, msg.safeTxGas, msg.baseGas]);
};

export const calculateMessageSignature = (privateKey: string, msg: UnsignedMessage) => {
  return signHexString(calculateMessageHash(msg), privateKey);
};

export const calculateMessageSignatures = async (privateKeys: string[], msg: UnsignedMessage) => {
  const signaturesPromises = privateKeys.map((value: string) =>
    calculateMessageSignature(value, msg));
  const sortedSignatures = sortPrivateKeysByAddress(await Promise.all(signaturesPromises));
  return concatenateSignatures(sortedSignatures);
};

const removePrefix = (value: string, index: number, array: string[]) => {
  const signature = value;
  if (value.length !== 132) {
    throw new Error(`Invalid signature length: ${signature} should be 132`);
  }
  if (value.indexOf('0x') !== 0) {
    throw new Error(`Invalid Signature: ${signature} needs prefix 0x`);
  }
  return signature.slice(2);
};

export const concatenateSignatures = (signatures: string[]) =>
  `0x${signatures.map(removePrefix).join('')}`;

const addressComparator = (privateKey1: string, privateKey2: string) => {
  const address1 = parseInt(new Wallet(privateKey1).address, 16);
  const address2 = parseInt(new Wallet(privateKey2).address, 16);
  if (address1 > address2) {
    return 1;
  } else if (address1 < address2) {
    return -1;
  } else {
    return 0;
  }
};

export const sortPrivateKeysByAddress = (privateKeys: string[]) =>
  privateKeys.sort(addressComparator);
