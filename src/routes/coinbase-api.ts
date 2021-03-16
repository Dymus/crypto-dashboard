import { Router } from "express";
import { getCoinbaseWallet } from "../controllers/coinbase-api-controller";

const router = Router();

router.get("/wallet", getCoinbaseWallet);

export default router;
