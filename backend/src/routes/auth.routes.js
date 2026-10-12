import { Router } from "express";
import { register, loginCandidate, loginAdmin, getMe, logout, refreshToken } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { originGuard } from "../middleware/originGuard.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register",      registerLimiter, register);
router.post("/login",         loginLimiter,    loginCandidate);
router.post("/admin/login",   loginLimiter,    loginAdmin);
router.post("/logout",        originGuard, logout);      // revokes access token + clears refresh cookie
router.post("/refresh",       originGuard, refreshToken); // issues new access token from refresh cookie
router.get("/me",             authenticateToken, getMe);

export default router;
