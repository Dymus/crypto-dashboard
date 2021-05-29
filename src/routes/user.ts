import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import * as Validator from '../middleware/validation';
import * as ApiUserController from '../api-controllers/api-user-controller';

const router = Router();

router.get('/refresh-auth-status', isAuth, ApiUserController.refreshUserAuthStatus);

router.get('/get-alerts', isAuth, ApiUserController.getUserAlerts);

router.put('/set-user-alerts', [isAuth, Validator.validateSetUserAlerts], ApiUserController.setUserAlerts);

router.get('/get-user-alert-notifications', isAuth, ApiUserController.getUserAlertNotifications);

router.put('/mark-all-user-alert-notifications-as-viewed', isAuth, ApiUserController.markAllUserAlertNotificationsAsViewed);

router.delete('/remove-all-alert-notifications', isAuth, ApiUserController.removeAllAlertNotifications);

export default router;
