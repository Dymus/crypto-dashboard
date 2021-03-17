import { Router } from "express";
import {
    getBinanceLogin,
    getBinanceRedirect,
} from "../controllers/binance-auth-controller";

const router = Router();

router.get("/login", getBinanceLogin);

router.get("/redirect", getBinanceRedirect);

export default router;
