import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware";
import {
    getDashboardStats,
    getRecentActivity,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    createCourse,
    updateCourse,
    deleteCourse,
    uploadNotes,
    uploadStorage,
    getLiveSessions,
    createLiveSession,
    updateLiveSession,
    deleteLiveSession,
    getChecklistSubmissions,
    getChecklistSubmissionById,
    exportChecklistSubmissionsToExcel,
} from "../controllers/adminController";

const router = Router();

// All routes require admin authentication
router.use(requireAdmin);

// Dashboard statistics
router.get("/stats", getDashboardStats);
router.get("/recent-activity", getRecentActivity);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Course management routes
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.post("/upload/notes", uploadStorage.single("file"), uploadNotes);

// Live session management routes
router.get("/live-sessions", getLiveSessions);
router.post("/live-sessions", createLiveSession);
router.put("/live-sessions/:id", updateLiveSession);
router.delete("/live-sessions/:id", deleteLiveSession);

// Checklist submissions routes
router.get("/checklist-submissions", getChecklistSubmissions);
router.get("/checklist-submissions/:id", getChecklistSubmissionById);
router.get("/checklist-submissions/export/excel", exportChecklistSubmissionsToExcel);

export default router;
