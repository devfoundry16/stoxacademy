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
    createGuestCoursePaymentIntent,
    confirmGuestCoursePayment,
    createGuestLiveSessionPaymentIntent,
    confirmGuestLiveSessionPayment,
    createGuestSubscriptionPaymentIntent,
    confirmGuestSubscriptionPayment,
    createGuestSessionPackagePaymentIntent,
    confirmGuestSessionPackagePayment,
} from "../controllers/paymentController";
import express from "express";

const router = Router();

// Course payment routes
router.post("/course/create-intent", authenticateToken, createCoursePaymentIntent);
router.post("/course/confirm", authenticateToken, confirmCoursePayment);
router.post("/course/guest-create-intent", createGuestCoursePaymentIntent);
router.post("/course/guest-confirm", confirmGuestCoursePayment);

// Live session payment routes
router.post("/live-session/create-intent", authenticateToken, createLiveSessionPaymentIntent);
router.post("/live-session/confirm", authenticateToken, confirmLiveSessionPayment);
router.post("/live-session/guest-create-intent", createGuestLiveSessionPaymentIntent);
router.post("/live-session/guest-confirm", confirmGuestLiveSessionPayment);

// 90 Circle subscription routes
router.post("/subscription/create-intent", authenticateToken, createSubscriptionPaymentIntent);
router.post("/subscription/confirm", authenticateToken, confirmSubscriptionPayment);
router.get("/subscription/status", authenticateToken, getSubscriptionStatus);
router.post("/subscription/guest-create-intent", createGuestSubscriptionPaymentIntent);
router.post("/subscription/guest-confirm", confirmGuestSubscriptionPayment);

// Individual session package routes
router.post("/session-package/create-intent", authenticateToken, createSessionPackagePaymentIntent);
router.post("/session-package/confirm", authenticateToken, confirmSessionPackagePayment);
router.post("/session-package/guest-create-intent", createGuestSessionPackagePaymentIntent);
router.post("/session-package/guest-confirm", confirmGuestSessionPackagePayment);

// Stripe webhook (raw body required)
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
