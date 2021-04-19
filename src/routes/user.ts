import { Router } from 'express';
import { getUserAlerts, getUserAuthStatus, setUserAlerts } from '../controllers/user-controller';
import { isAuth } from "../controllers/auth-controller"

const router = Router();

router.get('/auth-status', isAuth, getUserAuthStatus);
router.get('/getAlerts', isAuth, getUserAlerts);
router.put('/setUserAlerts', isAuth, setUserAlerts)

export default router;
