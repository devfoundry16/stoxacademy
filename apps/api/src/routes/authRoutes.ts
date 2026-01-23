import { Router } from "express";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  handleOAuthCallback,
  signOut,
  getCurrentUser,
  getProfile,
  updateProfile,
  updatePassword,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/signup", signUpWithEmail);
router.post("/signin", signInWithEmail);
router.post("/google", signInWithGoogle);
router.get("/callback", handleOAuthCallback);
router.post("/signout", signOut);
router.get("/me", authenticateToken, getCurrentUser);
router.get("/profile", authenticateToken, getProfile);
router.patch("/profile", authenticateToken, updateProfile);
router.patch("/password", authenticateToken, updatePassword);

export default router;

