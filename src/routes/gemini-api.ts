import {Router} from "express";
import { isAuth } from "../controllers/auth-controller";
import {getGeminiAvailableBalances, getGeminiTradesForAccount} from "../controllers/gemini-api-controller"

const router = Router();

router.get("/balances", [isAuth], getGeminiAvailableBalances);
router.get("/account-transactions/:currencyCode", [isAuth], getGeminiTradesForAccount);


export default router;