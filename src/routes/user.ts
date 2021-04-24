import { Router } from 'express';
import { getUserAlerts, refreshUserAuthStatus, setUserAlerts } from '../controllers/user-controller';
import { isAuth } from "../controllers/auth-controller"

const router = Router();

router.post('/refreshAuth', isAuth, refreshUserAuthStatus);
router.get('/getAlerts', isAuth, getUserAlerts);
router.put('/setUserAlerts', isAuth, setUserAlerts)

export default router;
