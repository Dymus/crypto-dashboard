import { Router } from 'express';
import { getUserAuthStatus } from '../controllers/user-controller';

const router = Router();

router.get('/auth-status', getUserAuthStatus);

export default router;
