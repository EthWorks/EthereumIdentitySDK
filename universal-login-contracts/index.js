const {MANAGEMENT_KEY, ACTION_KEY, CLAIM_KEY, ENCRYPTION_KEY, ECDSA_TYPE, RSA_TYPE, OPERATION_CALL} = require('./dist/consts.js');
const {sleep, waitToBeMined} = require('./dist/utils.js');

module.exports = {
  MANAGEMENT_KEY, ACTION_KEY, CLAIM_KEY, ENCRYPTION_KEY, ECDSA_TYPE, RSA_TYPE, OPERATION_CALL,
  sleep, waitToBeMined
};
