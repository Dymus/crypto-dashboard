import { Router } from "express";
import { isAuth } from "../controllers/auth-controller";
import { setGeminiApiAndSecret } from "../controllers/gemini-auth-controller";

const router = Router();

router.post("/saveGemini", [isAuth], setGeminiApiAndSecret);

export default router;