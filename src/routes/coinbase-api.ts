import { Router } from "express";
import {
    getCoinbaseWallet,
    getCoinbaseTransactionsForAccount,
} from "../controllers/coinbase-api-controller";

const router = Router();

router.get("/account-transactions/:accountId", getCoinbaseTransactionsForAccount);

router.get("/wallet", getCoinbaseWallet);

export default router;
