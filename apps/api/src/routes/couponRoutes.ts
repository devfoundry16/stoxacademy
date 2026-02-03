import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminMiddleware";
import {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    validateCoupon,
} from "../controllers/couponController";

const router = Router();

// User route - validate coupon (requires authentication)
router.get("/validate/:code", authenticateToken, validateCoupon);

// Admin routes - all require admin authentication
router.get("/", requireAdmin, getAllCoupons);
router.get("/:id", requireAdmin, getCouponById);
router.post("/", requireAdmin, createCoupon);
router.put("/:id", requireAdmin, updateCoupon);
router.delete("/:id", requireAdmin, deleteCoupon);
router.patch("/:id/toggle", requireAdmin, toggleCouponStatus);

export default router;
