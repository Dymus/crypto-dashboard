import {Router} from "express";
import {getGeminiAvailableBalances, getGeminiTradesForAccount} from "../controllers/gemini-api-controller"

const router = Router();

router.get("/balances", getGeminiAvailableBalances);
router.get("/account-transactions/:currencyCode", getGeminiTradesForAccount);


export default router;