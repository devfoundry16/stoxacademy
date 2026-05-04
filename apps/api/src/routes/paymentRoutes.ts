import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    createCoursePaymentIntent,
    confirmCoursePayment,
    createLiveSessionPaymentIntent,
    confirmLiveSessionPayment,
    createSubscriptionPaymentIntent,
    confirmSubscriptionPayment,
    createSessionPackagePaymentIntent,
    confirmSessionPackagePayment,
    getSubscriptionStatus,
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

// 90 Circle subscription routes
router.post("/subscription/create-intent", authenticateToken, createSubscriptionPaymentIntent);
router.post("/subscription/confirm", authenticateToken, confirmSubscriptionPayment);
router.get("/subscription/status", authenticateToken, getSubscriptionStatus);

// Individual session package routes
router.post("/session-package/create-intent", authenticateToken, createSessionPackagePaymentIntent);
router.post("/session-package/confirm", authenticateToken, confirmSessionPackagePayment);

// Stripe webhook (raw body required)
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
