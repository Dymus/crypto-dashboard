import { Router } from "express";
import {
    getTrendsForCryptocurrency
} from "../controllers/reddit-api-controller";

const router = Router();

router.get("/trends/:cryptocurrencyName", getTrendsForCryptocurrency);

export default router;
