import { Router } from "express";
import { isAuth } from "../controllers/auth-controller";
import { setGeminiApiAndSecret, deleteGeminiAccess } from "../controllers/gemini-auth-controller";

const router = Router();

router.post("/saveGemini", [isAuth], setGeminiApiAndSecret);

router.delete("/deleteGemini", [isAuth], deleteGeminiAccess)

export default router;