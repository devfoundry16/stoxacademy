import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    getAllLiveSessions,
    getLiveSessionById,
    enrollInLiveSession,
    getUserLiveSessions,
} from "../controllers/liveSessionController";

const router = Router();

// Public routes (can be accessed without authentication, but show different data if authenticated)
router.get("/", getAllLiveSessions);
router.get("/:id", getLiveSessionById);

// Protected routes (require authentication)
router.post("/enroll", authenticateToken, enrollInLiveSession);
router.get("/user/enrollments", authenticateToken, getUserLiveSessions);

export default router;
