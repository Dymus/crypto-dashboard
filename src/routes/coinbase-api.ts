import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import { isCoinbaseAuth } from '../middleware/coinbase-auth';
import * as ApiCoinbaseController from '../api-controllers/api-coinbase-controller';
import * as Validator from '../middleware/validation';

const router = Router();

router.get('/wallet', [isAuth, isCoinbaseAuth], ApiCoinbaseController.getCoinbaseWallet);

router.get(
  '/account-transactions/:accountId',
  [Validator.validateGetCoinbaseTransactions, Validator.checkValidationResult, isAuth, isCoinbaseAuth],
  ApiCoinbaseController.getCoinbaseTransactionsForAccount
);

router.get('/portfolio-performance', [isAuth, isCoinbaseAuth], ApiCoinbaseController.getCoinbasePortfolioPerformance);

export default router;
