import { Router } from "express";
import { postSaveCoinbaseToken, deleteCoinbaseAccess } from "../controllers/coinbase-auth-controller";
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

router.delete("/deleteCoinbase", [isAuth], deleteCoinbaseAccess)

export default router;
