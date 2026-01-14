import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    createCoursePaymentIntent,
    confirmCoursePayment,
    createLiveSessionPaymentIntent,
    confirmLiveSessionPayment,
    handleStripeWebhook,
} from "../controllers/paymentController";
import express from "express";

const router = Router();

// Course payment routes
router.post("/course/create-intent", authenticateToken, createCoursePaymentIntent);
router.post("/course/confirm", authenticateToken, confirmCoursePayment);

// Live session payment routes
router.post("/live-session/create-intent", authenticateToken, createLiveSessionPaymentIntent);
router.post("/live-session/confirm", authenticateToken, confirmLiveSessionPayment);

// Stripe webhook (raw body required)
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
