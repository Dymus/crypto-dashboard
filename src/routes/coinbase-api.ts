import { Router } from "express";
import {
    getCoinbaseWallet,
    getCoinbaseTransactionsForAccount,
} from "../controllers/coinbase-api-controller";
import { isAuth } from "../controllers/auth-controller"
import { isCoinbaseAuth } from "../controllers/coinbase-auth-controller";
import { param } from "express-validator";

const router = Router();

router.get("/account-transactions/:accountId", [
    isAuth,
    isCoinbaseAuth,
    param("accountId").notEmpty()
], getCoinbaseTransactionsForAccount
);

router.get("/wallet", [
    isAuth,
    isCoinbaseAuth
], getCoinbaseWallet
);

export default router;
