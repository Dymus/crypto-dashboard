import { Router } from 'express';
import { getUserAuthStatus } from '../controllers/user-controller';
import { isAuth } from "../controllers/auth-controller"

const router = Router();

router.get('/auth-status', isAuth, getUserAuthStatus);

export default router;
