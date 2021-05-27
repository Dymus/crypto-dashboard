import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import * as ApiGeminiAuthController from '../api-controllers/api-gemini-auth-controller';

const router = Router();

router.post('/saveGemini', isAuth, ApiGeminiAuthController.setGeminiApiAndSecret);

router.delete('/deleteGemini', isAuth, ApiGeminiAuthController.deleteGeminiAccess);

export default router;
