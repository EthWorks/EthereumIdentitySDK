import { Sanitizer, Either } from '@restless/restless';
import { utils } from 'ethers';

export const asBigNumberish: Sanitizer<utils.BigNumber> = (value, path) => {
  if (typeof value === 'string' || typeof value === 'number') {
    try {
      const bigNumber = utils.bigNumberify(value);
      return Either.right(bigNumber);
    } catch {
      return Either.left([{ path, expected: 'bigNumber' }]);
    }
  }
  return Either.left([{ path, expected: 'bigNumber' }]);
};


export const asArrayish: Sanitizer<string | number[]> = (value, path) => {
  if (typeof value === 'string') {
    return Either.right(value);
  } else if (Array.isArray(value)) {
    return Either.right(value);
  } else {
    return Either.left([{ path, expected: 'arrayish' }]);
  }
};

export const asStringOrNumber: Sanitizer<string | number> = (value, path) => {
  if (typeof value === 'string') {
    return Either.right(value);
  } else if (typeof value === 'number') {
    return Either.right(value);
  } else {
    return Either.left([{ path, expected: 'string or number' }]);
  }
};

export const asAny = (value: any) => Either.right(value);
