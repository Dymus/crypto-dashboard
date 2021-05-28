import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import { isCoinbaseAuth } from '../middleware/coinbase-auth';
import * as ApiCoinbaseAuthController from '../api-controllers/api-coinbase-auth-controller';
import * as Validator from '../middleware/validation';

const router = Router();

router.post(
  '/save-coinbase-access',
  [isAuth, Validator.validateSaveCoinbaseToken, Validator.checkValidationResult],
  ApiCoinbaseAuthController.postSaveCoinbaseToken
);

router.delete('/delete-coinbase-access', [isAuth, isCoinbaseAuth], ApiCoinbaseAuthController.deleteCoinbaseAccess);

export default router;
