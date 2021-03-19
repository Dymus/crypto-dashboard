import { Router } from "express";
import {
    getCoinbaseWallet,
    getCoinbaseTransactionsForAccount,
} from "../controllers/coinbase-api-controller";

import { isCoinbaseAuth } from "../controllers/coinbase-auth-controller";

const router = Router();

router.get(
    "/account-transactions/:accountId",
    isCoinbaseAuth,
    getCoinbaseTransactionsForAccount
);

router.get("/wallet", isCoinbaseAuth, getCoinbaseWallet);

export default router;
