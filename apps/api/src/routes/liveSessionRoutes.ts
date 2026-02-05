import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    getAllLiveSessions,
    getLiveSessionById,
    getMeetingToken,
    enrollInLiveSession,
    getUserLiveSessions,
    endMeeting,
} from "../controllers/liveSessionController";

const router = Router();

// Public routes (can be accessed without authentication, but show different data if authenticated)
router.get("/", getAllLiveSessions);
router.get("/:id", getLiveSessionById);

// Protected routes (require authentication)
router.get("/:sessionId/meeting-token", authenticateToken, getMeetingToken);
router.post("/:sessionId/end-meeting", authenticateToken, endMeeting);
router.post("/enroll", authenticateToken, enrollInLiveSession);
router.get("/user/enrollments", authenticateToken, getUserLiveSessions);

export default router;
