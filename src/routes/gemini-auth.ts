import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import * as Validator from '../middleware/validation';
import * as ApiGeminiAuthController from '../api-controllers/api-gemini-auth-controller';
import { isGeminiAuth } from '../middleware/gemini-auth';

const router = Router();

router.post('/save-gemini-access', [isAuth, Validator.validateSaveGeminiKeys], ApiGeminiAuthController.setGeminiApiAndSecret);

router.delete('/delete-gemini-access', [isAuth, isGeminiAuth], ApiGeminiAuthController.deleteGeminiAccess);

export default router;
