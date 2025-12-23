import { Router } from "express";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  handleOAuthCallback,
  signOut,
  getCurrentUser,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/signup", signUpWithEmail);
router.post("/signin", signInWithEmail);
router.post("/google", signInWithGoogle);
router.get("/callback", handleOAuthCallback);
router.post("/signout", authenticateToken, signOut);
router.get("/me", authenticateToken, getCurrentUser);

export default router;

