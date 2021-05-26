import {Router} from "express";
import { isAuth } from "../controllers/auth-controller";
import {getGeminiAvailableBalances, getGeminiTradesForAccount} from "../controllers/gemini-api-controller"
import { addGeminiSecretToRequest } from "../controllers/gemini-auth-controller";

const router = Router();

router.get("/balances", [isAuth, addGeminiSecretToRequest], getGeminiAvailableBalances);
router.get("/account-transactions/:currencyCode", [isAuth, addGeminiSecretToRequest], getGeminiTradesForAccount);


export default router;