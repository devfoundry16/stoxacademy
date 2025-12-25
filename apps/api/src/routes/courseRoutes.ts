import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  purchaseCourse,
  getUserCourses,
  updateLessonProgress,
} from "../controllers/courseController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Protected routes
router.post("/purchase", authenticateToken, purchaseCourse);
router.get("/user/courses", authenticateToken, getUserCourses);
router.post("/lesson/progress", authenticateToken, updateLessonProgress);

export default router;

