import { Router } from "express";
import {
    getCoinbaseWallet,
    getCoinbaseTransactionsForCoin,
} from "../controllers/coinbase-api-controller";

const router = Router();

router.get("/coin-transactions", getCoinbaseTransactionsForCoin);
router.get("/wallet", getCoinbaseWallet);

export default router;
