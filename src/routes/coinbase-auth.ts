import { Router } from "express";
import { postSaveCoinbaseToken } from "../controllers/coinbase-auth-controller";
import { isAuth } from "../controllers/auth-controller"
import { body } from "express-validator";

const router = Router();

router.post("/save-token", [
  isAuth,
  body("coinbaseTokens").custom((coinbaseTokens) => {
    if ("access_token" in coinbaseTokens && "refresh_token" in coinbaseTokens) {
      return true
    } else {
      return false
    }
  })
], postSaveCoinbaseToken);

export default router;
