import express from 'express';
import asyncMiddleware from '../middlewares/async_middleware';

export const create = (walletContractService) => async (req, res, next) => {
  const {managementKey, ensName} = req.body;
  try {
    const transaction = await walletContractService.create(managementKey, ensName);
    res.status(201)
      .type('json')
      .send(JSON.stringify({transaction}));
  } catch (err) {
    next(err);
  }
};

export const execution = (walletContractService) => async (req, res, next) => {
  try {
    const transaction = await walletContractService.executeSigned(req.body);
    res.status(201)
      .type('json')
      .send(JSON.stringify({transaction}));
  } catch (err) {
    next(err);
  }
};

export default (walletContractService) => {
  const router = new express.Router();

  router.post('/',
    asyncMiddleware(create(walletContractService)));

  router.post('/execution',
    asyncMiddleware(execution(walletContractService)));

  return router;
};
