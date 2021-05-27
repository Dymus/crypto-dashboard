import { Router } from 'express';

import * as ApiAuthController from '../api-controllers/api-auth-controller';
import * as Validator from '../middleware/validation';

const router = Router();

router.get('/refresh-token', ApiAuthController.refreshJWTToken);

router.post(
  '/register',
  [Validator.validateRegistration, Validator.checkValidationResult],
  ApiAuthController.postRegister
);

router.post('/login', [Validator.validateLogin, Validator.checkValidationResult], ApiAuthController.postLogin);

export default router;
