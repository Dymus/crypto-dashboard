import { Router } from 'express';

import { isAuth } from '../middleware/auth';
import * as ApiUserController from '../api-controllers/api-user-controller';

const router = Router();

router.post('/refreshAuth', isAuth, ApiUserController.refreshUserAuthStatus);

router.get('/getAlerts', isAuth, ApiUserController.getUserAlerts);

router.put('/setUserAlerts', isAuth, ApiUserController.setUserAlerts);

router.get('/getUserAlertNotifications', isAuth, ApiUserController.getUserAlertNotifications);

router.put('/markAllUserAlertNotificationsAsViewed', isAuth, ApiUserController.markAllUserAlertNotificationsAsViewed);

router.delete('/removeAllAlertNotifications', isAuth, ApiUserController.removeAllAlertNotifications);

export default router;
