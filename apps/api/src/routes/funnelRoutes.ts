import { Router } from "express";
import { submitWebinarRegistration } from "../controllers/funnelController";

const router = Router();

router.post("/webinar-registrations", submitWebinarRegistration);

export default router;
