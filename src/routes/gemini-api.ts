import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import { addGeminiSecretToRequest } from '../middleware/gemini-auth';
import * as ApiGeminiController from '../api-controllers/api-gemini-controller';

const router = Router();

router.get('/balances', [isAuth, addGeminiSecretToRequest], ApiGeminiController.getGeminiAvailableBalances);

router.get(
  '/account-transactions/:currencyCode',
  [isAuth, addGeminiSecretToRequest],
  ApiGeminiController.getGeminiTradesForAccount
);

export default router;
