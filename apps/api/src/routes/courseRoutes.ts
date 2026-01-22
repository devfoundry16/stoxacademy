import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  purchaseCourse,
  getUserCourses,
  updateLessonProgress,
  getCourseLessons,
  getCourseProgress,
} from "../controllers/courseController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.get("/:id/lessons", getCourseLessons);

// Protected routes
router.post("/purchase", authenticateToken, purchaseCourse);
router.get("/user/courses", authenticateToken, getUserCourses);
router.get("/:id/progress", authenticateToken, getCourseProgress);
router.post("/lesson/progress", authenticateToken, updateLessonProgress);

export default router;


