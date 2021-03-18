import { Router } from "express";
import { postSaveCoinbaseToken } from "../controllers/coinbase-auth-controller";

const router = Router();

router.post("/save-token", postSaveCoinbaseToken);

export default router;
