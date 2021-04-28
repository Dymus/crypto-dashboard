import { Router } from 'express';
import { getUserAlertNotifications, getUserAlerts, getUserAuthStatus, markAllUserAlertNotificationsAsViewed, setUserAlerts, removeAllAlertNotifications } from '../controllers/user-controller';
import { isAuth } from "../controllers/auth-controller"

const router = Router();

router.get('/auth-status', isAuth, getUserAuthStatus);
router.get('/getAlerts', isAuth, getUserAlerts);
router.put('/setUserAlerts', isAuth, setUserAlerts);
router.get('/getUserAlertNotifications', isAuth, getUserAlertNotifications);
router.put('/markAllUserAlertNotificationsAsViewed', isAuth, markAllUserAlertNotificationsAsViewed)
router.put('/removeAllAlertNotifications', isAuth, removeAllAlertNotifications)
export default router;
