import { Router } from "express";
import { getCoinbaseLogin, getCoinbaseRedirect } from "../controllers/coinbase-auth-controller";

const router = Router();

router.get('/login', getCoinbaseLogin)

router.get('/redirect', getCoinbaseRedirect)

export default router;