import { Router } from "express";
import { submitChecklistResponse, getChecklistQuestions } from "../controllers/checklistController";

const router = Router();

router.get("/", getChecklistQuestions);
router.post("/submit", submitChecklistResponse);

export default router;
