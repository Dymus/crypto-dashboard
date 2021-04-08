import {Router} from "express";
import {getGeminiAvailableBalances} from "../controllers/gemini-api-controller"

const router = Router();

router.get("/balances", getGeminiAvailableBalances);

export default router;