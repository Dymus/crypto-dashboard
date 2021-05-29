import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import { addGeminiSecretToRequest, isGeminiAuth } from '../middleware/gemini-auth';
import * as ApiGeminiController from '../api-controllers/api-gemini-controller';

const router = Router();

router.get('/balances', [isAuth, isGeminiAuth, addGeminiSecretToRequest], ApiGeminiController.getGeminiAvailableBalances);

router.get(
  '/account-transactions/:currencyCode',
  [isAuth, isGeminiAuth, addGeminiSecretToRequest],
  ApiGeminiController.getGeminiTradesForAccount,
);

export default router;
