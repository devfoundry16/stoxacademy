import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { supabaseAdmin } from "../config/supabase";
import { incrementCouponUsage } from "./couponController";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/emailService";

// ==================== Guest Checkout Helpers ====================

const GUEST_TOKEN_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "guest-checkout-secret";

interface GuestTokenPayload {
    userId: string;
    paymentIntentId: string;
    email: string;
}

async function findOrCreateGuestUser(
    email: string,
    firstName?: string,
    lastName?: string
): Promise<{ userId: string; isNewUser: boolean; userEmail: string }> {
    // Try to find an existing user by email in public.users
    const { data: existingProfile } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

    if (existingProfile?.id) {
        return { userId: existingProfile.id, isNewUser: false, userEmail: email };
    }

    const normalizedEmail = email.toLowerCase();

    // Create a new passwordless Supabase auth user
    // password_set: false is used by the updatePassword endpoint to allow setting a
    // password without requiring a current password (since none was ever set).
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
            first_name: firstName || "",
            last_name: lastName || "",
            role: "student",
            password_set: false,
        },
    });

    if (authError || !authData.user) {
        throw new Error(authError?.message || "Failed to create guest user");
    }

    // Mirror the user into public.users (same pattern as authController.signUpWithEmail)
    const { error: dbError } = await supabaseAdmin.from("users").insert({
        id: authData.user.id,
        email: normalizedEmail,
        first_name: firstName || "",
        last_name: lastName || "",
        role: "student",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    if (dbError) {
        // Roll back the auth user if DB insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user profile: ${dbError.message}`);
    }

    return { userId: authData.user.id, isNewUser: true, userEmail: normalizedEmail };
}

function signGuestToken(userId: string, paymentIntentId: string, email: string): string {
    return jwt.sign({ userId, paymentIntentId, email } as GuestTokenPayload, GUEST_TOKEN_SECRET, {
        expiresIn: "2h",
    });
}

function verifyGuestToken(token: string): GuestTokenPayload {
    return jwt.verify(token, GUEST_TOKEN_SECRET) as GuestTokenPayload;
}

async function sendPasswordSetupEmail(email: string): Promise<void> {
    try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        // Generate a password-recovery (set-password) link via Supabase Admin
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: {
                redirectTo: `${frontendUrl}/auth/callback?next=/set-password`,
            },
        });

        if (error || !data?.properties?.action_link) {
            console.error("Failed to generate password setup link:", error?.message);
            return;
        }

        const setupLink = data.properties.action_link;

        await sendEmail({
            to: email,
            subject: "Set your STOX Academy password",
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
                    <h2 style="color:#1e3a5f;margin-bottom:8px;">Welcome to STOX Academy!</h2>
                    <p style="color:#374151;margin-bottom:24px;">
                        Your purchase was successful. To access your content, please set a password for your account.
                    </p>
                    <a href="${setupLink}"
                       style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        Set My Password
                    </a>
                    <p style="color:#6b7280;font-size:13px;margin-top:24px;">
                        This link expires in 24 hours. If you did not make a purchase, you can ignore this email.
                    </p>
                </div>
            `,
        });
    } catch (err: any) {
        // Non-fatal — log but don't fail the purchase confirmation
        console.error("Failed to send password setup email to:", email, err?.message);
    }
}

// ==================== Course Payment ====================

export const createCoursePaymentIntent = async (req: Request, res: Response) => {
    try {
        const { courseId, couponCode } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Get user
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Get course details
        const { data: course, error: courseError } = await supabaseAdmin
            .from("courses")
            .select("id, title, price")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Check if already purchased
        const { data: existingPurchase } = await supabaseAdmin
            .from("user_courses")
            .select("id")
            .eq("user_id", userData.user.id)
            .eq("course_id", courseId)
            .single();

        if (existingPurchase) {
            return res.status(400).json({ error: "Course already purchased" });
        }

        let finalPrice = parseFloat(course.price);
        let discountPercentage = 0;
        let validCouponCode = null;

        // Validate and apply coupon if provided
        if (couponCode) {
            const upperCode = couponCode.toUpperCase().trim();
            const { data: coupon, error: couponError } = await supabaseAdmin
                .from("coupons")
                .select("*")
                .eq("code", upperCode)
                .single();

            if (couponError || !coupon) {
                return res.status(400).json({ error: "Invalid coupon code" });
            }

            if (!coupon.is_active) {
                return res.status(400).json({ error: "This coupon is not active" });
            }

            if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                return res.status(400).json({ error: "This coupon has reached its usage limit" });
            }

            // Apply discount
            discountPercentage = coupon.percentage;
            finalPrice = finalPrice * (1 - discountPercentage / 100);
            validCouponCode = upperCode;
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalPrice * 100), // Convert to cents
            currency: "usd",
            metadata: {
                userId: userData.user.id,
                courseId: course.id,
                courseTitle: course.title,
                type: "course",
                couponCode: validCouponCode || "",
                discountPercentage: discountPercentage.toString(),
                originalPrice: course.price,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            discountPercentage,
            originalPrice: course.price,
            finalPrice: finalPrice.toFixed(2),
        });
    } catch (error: any) {
        console.error("Create payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmCoursePayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Get user
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        const courseId = paymentIntent.metadata.courseId;
        const userId = paymentIntent.metadata.userId;

        // Verify user matches
        if (userId !== userData.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Check if already enrolled
        const { data: existingPurchase } = await supabaseAdmin
            .from("user_courses")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .single();

        if (existingPurchase) {
            return res.status(200).json({
                message: "Already enrolled",
                alreadyEnrolled: true
            });
        }

        // Get course for price
        const { data: course } = await supabaseAdmin
            .from("courses")
            .select("price")
            .eq("id", courseId)
            .single();

        // Get coupon info from metadata
        const couponCode = paymentIntent.metadata.couponCode || null;
        const discountPercentage = paymentIntent.metadata.discountPercentage ? parseInt(paymentIntent.metadata.discountPercentage) : null;
        const originalPrice = paymentIntent.metadata.originalPrice ? parseFloat(paymentIntent.metadata.originalPrice) : null;

        // Calculate actual price paid (with discount if applicable)
        let pricePaid = parseFloat(course?.price);
        if (discountPercentage && discountPercentage > 0) {
            pricePaid = pricePaid * (1 - discountPercentage / 100);
        }
        // Create enrollment record
        const { data: purchase, error: purchaseError } = await supabaseAdmin
            .from("user_courses")
            .insert({
                user_id: userId,
                course_id: courseId,
                price_paid: pricePaid,
                coupon_code: couponCode,
                discount_percentage: discountPercentage,
                original_price: originalPrice,
            })
            .select()
            .single();

        if (purchaseError) {
            return res.status(400).json({ error: purchaseError.message });
        }

        // Increment coupon usage if coupon was used
        if (couponCode) {
            await incrementCouponUsage(couponCode);
        }

        // Increment student count
        const { data: currentCourse } = await supabaseAdmin
            .from("courses")
            .select("students")
            .eq("id", courseId)
            .single();

        if (currentCourse) {
            const newStudentCount = (currentCourse.students || 0) + 1;
            await supabaseAdmin
                .from("courses")
                .update({
                    students: newStudentCount,
                    updated_at: new Date().toISOString()
                })
                .eq("id", courseId);
        }

        return res.status(201).json({
            message: "Course purchased successfully",
            purchase,
        });
    } catch (error: any) {
        console.error("Confirm payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Live Session Payment ====================

export const createLiveSessionPaymentIntent = async (req: Request, res: Response) => {
    try {
        const { sessionId, couponCode } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Get user
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Get session details
        const { data: session, error: sessionError } = await supabaseAdmin
            .from("live_sessions")
            .select("id, title, price, max_participants, participants_count")
            .eq("id", sessionId)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({ error: "Live session not found" });
        }

        // Check if max participants reached
        if (session.max_participants && session.participants_count >= session.max_participants) {
            return res.status(400).json({ error: "Session is full. Maximum participants reached." });
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabaseAdmin
            .from("user_live_sessions")
            .select("id")
            .eq("user_id", userData.user.id)
            .eq("session_id", sessionId)
            .single();

        if (existingEnrollment) {
            return res.status(400).json({ error: "Already enrolled in this live session" });
        }

        let finalPrice = parseFloat(session.price);
        let discountPercentage = 0;
        let validCouponCode = null;

        // Validate and apply coupon if provided
        if (couponCode) {
            const upperCode = couponCode.toUpperCase().trim();
            const { data: coupon, error: couponError } = await supabaseAdmin
                .from("coupons")
                .select("*")
                .eq("code", upperCode)
                .single();

            if (couponError || !coupon) {
                return res.status(400).json({ error: "Invalid coupon code" });
            }

            if (!coupon.is_active) {
                return res.status(400).json({ error: "This coupon is not active" });
            }

            if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                return res.status(400).json({ error: "This coupon has reached its usage limit" });
            }

            // Apply discount
            discountPercentage = coupon.percentage;
            finalPrice = finalPrice * (1 - discountPercentage / 100);
            validCouponCode = upperCode;
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalPrice * 100), // Convert to cents
            currency: "usd",
            metadata: {
                userId: userData.user.id,
                sessionId: session.id,
                sessionTitle: session.title,
                type: "live_session",
                couponCode: validCouponCode || "",
                discountPercentage: discountPercentage.toString(),
                originalPrice: session.price,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            discountPercentage,
            originalPrice: session.price,
            finalPrice: finalPrice.toFixed(2),
        });
    } catch (error: any) {
        console.error("Create payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmLiveSessionPayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Get user
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        const sessionId = paymentIntent.metadata.sessionId;
        const userId = paymentIntent.metadata.userId;

        // Verify user matches
        if (userId !== userData.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabaseAdmin
            .from("user_live_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("session_id", sessionId)
            .single();

        if (existingEnrollment) {
            return res.status(200).json({
                message: "Already enrolled",
                alreadyEnrolled: true
            });
        }

        // Get session for price
        const { data: session } = await supabaseAdmin
            .from("live_sessions")
            .select("price")
            .eq("id", sessionId)
            .single();

        // Get coupon info from metadata
        const couponCode = paymentIntent.metadata.couponCode || null;
        const discountPercentage = paymentIntent.metadata.discountPercentage ? parseInt(paymentIntent.metadata.discountPercentage) : null;
        const originalPrice = paymentIntent.metadata.originalPrice ? parseFloat(paymentIntent.metadata.originalPrice) : null;

        // Calculate actual price paid (with discount if applicable)
        let pricePaid = parseFloat(session?.price);
        if (discountPercentage && discountPercentage > 0) {
            pricePaid = pricePaid * (1 - discountPercentage / 100);
        }

        // Create enrollment record
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from("user_live_sessions")
            .insert({
                user_id: userId,
                session_id: sessionId,
                price_paid: pricePaid,
                coupon_code: couponCode,
                discount_percentage: discountPercentage,
                original_price: originalPrice,
            })
            .select()
            .single();

        if (enrollmentError) {
            return res.status(400).json({ error: enrollmentError.message });
        }

        // Increment coupon usage if coupon was used
        if (couponCode) {
            await incrementCouponUsage(couponCode);
        }

        // Increment participants count
        const { data: currentSession } = await supabaseAdmin
            .from("live_sessions")
            .select("participants_count")
            .eq("id", sessionId)
            .single();

        if (currentSession) {
            const newCount = (currentSession.participants_count || 0) + 1;
            await supabaseAdmin
                .from("live_sessions")
                .update({
                    participants_count: newCount,
                    updated_at: new Date().toISOString()
                })
                .eq("id", sessionId);
        }

        return res.status(201).json({
            message: "Successfully enrolled in live session",
            enrollment,
        });
    } catch (error: any) {
        console.error("Confirm payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Subscription Payment (90 Circle) ====================

const SUBSCRIPTION_PRICE_USD = 1500;

const VALID_PROGRAM_TYPES = ["stock_market", "gold_forex", "crypto"] as const;
type ProgramType = typeof VALID_PROGRAM_TYPES[number];

export const createSubscriptionPaymentIntent = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const { programType } = req.body as { programType?: string };
        if (!programType || !VALID_PROGRAM_TYPES.includes(programType as ProgramType)) {
            return res.status(400).json({ error: "Invalid programType. Must be one of: stock_market, gold_forex, crypto" });
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Check for an existing active subscription for this specific program
        const now = new Date().toISOString();
        const { data: existingSub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id, expires_at")
            .eq("user_id", userData.user.id)
            .eq("program_type", programType)
            .eq("status", "active")
            .gt("expires_at", now)
            .maybeSingle();

        if (existingSub) {
            return res.status(400).json({ error: "You already have an active subscription for this program" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: SUBSCRIPTION_PRICE_USD * 100,
            currency: "usd",
            metadata: {
                userId: userData.user.id,
                type: "subscription",
                programType,
            },
            automatic_payment_methods: { enabled: true },
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            finalPrice: SUBSCRIPTION_PRICE_USD.toFixed(2),
        });
    } catch (error: any) {
        console.error("Create subscription payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmSubscriptionPayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        if (paymentIntent.metadata.userId !== userData.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Idempotency: check if already recorded
        const { data: existing } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ message: "Subscription already activated", alreadyActivated: true });
        }

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        const programType = paymentIntent.metadata.programType as ProgramType;
        if (!programType || !VALID_PROGRAM_TYPES.includes(programType)) {
            return res.status(400).json({ error: "Missing or invalid programType in payment metadata" });
        }

        const { data: subscription, error: subError } = await supabaseAdmin
            .from("user_subscriptions")
            .insert({
                user_id: userData.user.id,
                program_type: programType,
                status: "active",
                group_sessions_remaining: 12,
                individual_sessions_remaining: 8,
                price_paid: SUBSCRIPTION_PRICE_USD,
                stripe_payment_intent_id: paymentIntentId,
                started_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (subError) {
            return res.status(400).json({ error: subError.message });
        }

        return res.status(201).json({
            message: "90 Circle subscription activated successfully",
            subscription,
        });
    } catch (error: any) {
        console.error("Confirm subscription payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Session Package Payment (Individual Sessions) ====================

const SESSION_PACKAGE_PRICES: Record<string, number> = {
    "3_sessions": 599,
    "6_sessions": 999,
};

const SESSION_PACKAGE_COUNTS: Record<string, number> = {
    "3_sessions": 3,
    "6_sessions": 6,
};

export const createSessionPackagePaymentIntent = async (req: Request, res: Response) => {
    try {
        const { packageType, category } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        if (!["3_sessions", "6_sessions"].includes(packageType)) {
            return res.status(400).json({ error: "Invalid package type. Must be '3_sessions' or '6_sessions'" });
        }

        if (!["gold_forex", "crypto"].includes(category)) {
            return res.status(400).json({ error: "Invalid category. Must be 'gold_forex' or 'crypto'" });
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const price = SESSION_PACKAGE_PRICES[packageType];

        const paymentIntent = await stripe.paymentIntents.create({
            amount: price * 100,
            currency: "usd",
            metadata: {
                userId: userData.user.id,
                type: "session_package",
                packageType,
                category,
            },
            automatic_payment_methods: { enabled: true },
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            finalPrice: price.toFixed(2),
        });
    } catch (error: any) {
        console.error("Create session package payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmSessionPackagePayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        if (paymentIntent.metadata.userId !== userData.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Idempotency check
        const { data: existing } = await supabaseAdmin
            .from("user_session_packages")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ message: "Package already recorded", alreadyRecorded: true });
        }

        const packageType = paymentIntent.metadata.packageType;
        const category = paymentIntent.metadata.category;
        const sessionsTotal = SESSION_PACKAGE_COUNTS[packageType];
        const price = SESSION_PACKAGE_PRICES[packageType];

        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from("user_session_packages")
            .insert({
                user_id: userData.user.id,
                category,
                package_type: packageType,
                sessions_total: sessionsTotal,
                sessions_remaining: sessionsTotal,
                price_paid: price,
                stripe_payment_intent_id: paymentIntentId,
                purchased_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (pkgError) {
            return res.status(400).json({ error: pkgError.message });
        }

        return res.status(201).json({
            message: "Session package purchased successfully",
            package: pkg,
        });
    } catch (error: any) {
        console.error("Confirm session package payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const now = new Date().toISOString();

        // Get all active subscriptions (one per program_type)
        const { data: subscriptions } = await supabaseAdmin
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", userData.user.id)
            .eq("status", "active")
            .gt("expires_at", now)
            .order("created_at", { ascending: false });

        // Get all session packages for this user
        const { data: packages } = await supabaseAdmin
            .from("user_session_packages")
            .select("*")
            .eq("user_id", userData.user.id)
            .gt("sessions_remaining", 0)
            .order("purchased_at", { ascending: false });

        return res.status(200).json({
            subscriptions: subscriptions || [],
            sessionPackages: packages || [],
        });
    } catch (error: any) {
        console.error("Get subscription status error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Guest Course Payment ====================

export const createGuestCoursePaymentIntent = async (req: Request, res: Response) => {
    try {
        const { courseId, couponCode, email, firstName, lastName } = req.body;

        if (!email || !courseId) {
            return res.status(400).json({ error: "email and courseId are required" });
        }

        const { userId, isNewUser, userEmail } = await findOrCreateGuestUser(email, firstName, lastName);

        const { data: course, error: courseError } = await supabaseAdmin
            .from("courses")
            .select("id, title, price")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return res.status(404).json({ error: "Course not found" });
        }

        const { data: existingPurchase } = await supabaseAdmin
            .from("user_courses")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .single();

        if (existingPurchase) {
            return res.status(400).json({ error: "Course already purchased" });
        }

        let finalPrice = parseFloat(course.price);
        let discountPercentage = 0;
        let validCouponCode = null;

        if (couponCode) {
            const upperCode = couponCode.toUpperCase().trim();
            const { data: coupon, error: couponError } = await supabaseAdmin
                .from("coupons")
                .select("*")
                .eq("code", upperCode)
                .single();

            if (couponError || !coupon) return res.status(400).json({ error: "Invalid coupon code" });
            if (!coupon.is_active) return res.status(400).json({ error: "This coupon is not active" });
            if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                return res.status(400).json({ error: "This coupon has reached its usage limit" });
            }

            discountPercentage = coupon.percentage;
            finalPrice = finalPrice * (1 - discountPercentage / 100);
            validCouponCode = upperCode;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalPrice * 100),
            currency: "usd",
            metadata: {
                userId,
                courseId: course.id,
                courseTitle: course.title,
                type: "course",
                couponCode: validCouponCode || "",
                discountPercentage: discountPercentage.toString(),
                originalPrice: course.price,
            },
            automatic_payment_methods: { enabled: true },
        });

        const guestToken = signGuestToken(userId, paymentIntent.id, userEmail);

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            guestToken,
            isNewUser,
            discountPercentage,
            originalPrice: course.price,
            finalPrice: finalPrice.toFixed(2),
        });
    } catch (error: any) {
        console.error("Guest create course payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmGuestCoursePayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId, guestToken } = req.body;

        if (!paymentIntentId || !guestToken) {
            return res.status(400).json({ error: "paymentIntentId and guestToken are required" });
        }

        let payload: GuestTokenPayload;
        try {
            payload = verifyGuestToken(guestToken);
        } catch {
            return res.status(401).json({ error: "Invalid or expired guest token" });
        }

        if (payload.paymentIntentId !== paymentIntentId) {
            return res.status(403).json({ error: "Token does not match payment intent" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }
        if (paymentIntent.metadata.userId !== payload.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const courseId = paymentIntent.metadata.courseId;
        const userId = payload.userId;

        const { data: existingPurchase } = await supabaseAdmin
            .from("user_courses")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .single();

        if (existingPurchase) {
            return res.status(200).json({ message: "Already enrolled", alreadyEnrolled: true });
        }

        const { data: course } = await supabaseAdmin
            .from("courses")
            .select("price, students")
            .eq("id", courseId)
            .single();

        const couponCode = paymentIntent.metadata.couponCode || null;
        const discountPercentage = paymentIntent.metadata.discountPercentage
            ? parseInt(paymentIntent.metadata.discountPercentage)
            : null;
        const originalPrice = paymentIntent.metadata.originalPrice
            ? parseFloat(paymentIntent.metadata.originalPrice)
            : null;

        let pricePaid = parseFloat(course?.price);
        if (discountPercentage && discountPercentage > 0) {
            pricePaid = pricePaid * (1 - discountPercentage / 100);
        }

        const { data: purchase, error: purchaseError } = await supabaseAdmin
            .from("user_courses")
            .insert({
                user_id: userId,
                course_id: courseId,
                price_paid: pricePaid,
                coupon_code: couponCode,
                discount_percentage: discountPercentage,
                original_price: originalPrice,
            })
            .select()
            .single();

        if (purchaseError) {
            return res.status(400).json({ error: purchaseError.message });
        }

        if (couponCode) await incrementCouponUsage(couponCode);

        const newStudentCount = (course?.students || 0) + 1;
        await supabaseAdmin
            .from("courses")
            .update({ students: newStudentCount, updated_at: new Date().toISOString() })
            .eq("id", courseId);

        await sendPasswordSetupEmail(payload.email);

        return res.status(201).json({
            message: "Course purchased successfully",
            purchase,
            isNewUser: true,
        });
    } catch (error: any) {
        console.error("Confirm guest course payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Guest Live Session Payment ====================

export const createGuestLiveSessionPaymentIntent = async (req: Request, res: Response) => {
    try {
        const { sessionId, couponCode, email, firstName, lastName } = req.body;

        if (!email || !sessionId) {
            return res.status(400).json({ error: "email and sessionId are required" });
        }

        const { userId, isNewUser, userEmail } = await findOrCreateGuestUser(email, firstName, lastName);

        const { data: session, error: sessionError } = await supabaseAdmin
            .from("live_sessions")
            .select("id, title, price, max_participants, participants_count")
            .eq("id", sessionId)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({ error: "Live session not found" });
        }

        if (session.max_participants && session.participants_count >= session.max_participants) {
            return res.status(400).json({ error: "Session is full. Maximum participants reached." });
        }

        const { data: existingEnrollment } = await supabaseAdmin
            .from("user_live_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("session_id", sessionId)
            .single();

        if (existingEnrollment) {
            return res.status(400).json({ error: "Already enrolled in this live session" });
        }

        let finalPrice = parseFloat(session.price);
        let discountPercentage = 0;
        let validCouponCode = null;

        if (couponCode) {
            const upperCode = couponCode.toUpperCase().trim();
            const { data: coupon, error: couponError } = await supabaseAdmin
                .from("coupons")
                .select("*")
                .eq("code", upperCode)
                .single();

            if (couponError || !coupon) return res.status(400).json({ error: "Invalid coupon code" });
            if (!coupon.is_active) return res.status(400).json({ error: "This coupon is not active" });
            if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                return res.status(400).json({ error: "This coupon has reached its usage limit" });
            }

            discountPercentage = coupon.percentage;
            finalPrice = finalPrice * (1 - discountPercentage / 100);
            validCouponCode = upperCode;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalPrice * 100),
            currency: "usd",
            metadata: {
                userId,
                sessionId: session.id,
                sessionTitle: session.title,
                type: "live_session",
                couponCode: validCouponCode || "",
                discountPercentage: discountPercentage.toString(),
                originalPrice: session.price,
            },
            automatic_payment_methods: { enabled: true },
        });

        const guestToken = signGuestToken(userId, paymentIntent.id, userEmail);

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            guestToken,
            isNewUser,
            discountPercentage,
            originalPrice: session.price,
            finalPrice: finalPrice.toFixed(2),
        });
    } catch (error: any) {
        console.error("Guest create live session payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmGuestLiveSessionPayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId, guestToken } = req.body;

        if (!paymentIntentId || !guestToken) {
            return res.status(400).json({ error: "paymentIntentId and guestToken are required" });
        }

        let payload: GuestTokenPayload;
        try {
            payload = verifyGuestToken(guestToken);
        } catch {
            return res.status(401).json({ error: "Invalid or expired guest token" });
        }

        if (payload.paymentIntentId !== paymentIntentId) {
            return res.status(403).json({ error: "Token does not match payment intent" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }
        if (paymentIntent.metadata.userId !== payload.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const sessionId = paymentIntent.metadata.sessionId;
        const userId = payload.userId;

        const { data: existingEnrollment } = await supabaseAdmin
            .from("user_live_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("session_id", sessionId)
            .single();

        if (existingEnrollment) {
            return res.status(200).json({ message: "Already enrolled", alreadyEnrolled: true });
        }

        const { data: liveSession } = await supabaseAdmin
            .from("live_sessions")
            .select("price, participants_count")
            .eq("id", sessionId)
            .single();

        const couponCode = paymentIntent.metadata.couponCode || null;
        const discountPercentage = paymentIntent.metadata.discountPercentage
            ? parseInt(paymentIntent.metadata.discountPercentage)
            : null;
        const originalPrice = paymentIntent.metadata.originalPrice
            ? parseFloat(paymentIntent.metadata.originalPrice)
            : null;

        let pricePaid = parseFloat(liveSession?.price);
        if (discountPercentage && discountPercentage > 0) {
            pricePaid = pricePaid * (1 - discountPercentage / 100);
        }

        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from("user_live_sessions")
            .insert({
                user_id: userId,
                session_id: sessionId,
                price_paid: pricePaid,
                coupon_code: couponCode,
                discount_percentage: discountPercentage,
                original_price: originalPrice,
            })
            .select()
            .single();

        if (enrollmentError) {
            return res.status(400).json({ error: enrollmentError.message });
        }

        if (couponCode) await incrementCouponUsage(couponCode);

        const newCount = (liveSession?.participants_count || 0) + 1;
        await supabaseAdmin
            .from("live_sessions")
            .update({ participants_count: newCount, updated_at: new Date().toISOString() })
            .eq("id", sessionId);

        await sendPasswordSetupEmail(payload.email);

        return res.status(201).json({
            message: "Successfully enrolled in live session",
            enrollment,
            isNewUser: true,
        });
    } catch (error: any) {
        console.error("Confirm guest live session payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Guest Subscription Payment (90 Circle) ====================

export const createGuestSubscriptionPaymentIntent = async (req: Request, res: Response) => {
    try {
        const { email, firstName, lastName, programType } = req.body;

        if (!email) {
            return res.status(400).json({ error: "email is required" });
        }

        if (!programType || !VALID_PROGRAM_TYPES.includes(programType as ProgramType)) {
            return res.status(400).json({ error: "Invalid programType. Must be one of: stock_market, gold_forex, crypto" });
        }

        const { userId, isNewUser, userEmail } = await findOrCreateGuestUser(email, firstName, lastName);

        const now = new Date().toISOString();
        const { data: existingSub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id, expires_at")
            .eq("user_id", userId)
            .eq("program_type", programType)
            .eq("status", "active")
            .gt("expires_at", now)
            .maybeSingle();

        if (existingSub) {
            return res.status(400).json({ error: "This email already has an active subscription for this program" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: SUBSCRIPTION_PRICE_USD * 100,
            currency: "usd",
            metadata: { userId, type: "subscription", programType },
            automatic_payment_methods: { enabled: true },
        });

        const guestToken = signGuestToken(userId, paymentIntent.id, userEmail);

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            guestToken,
            isNewUser,
            finalPrice: SUBSCRIPTION_PRICE_USD.toFixed(2),
        });
    } catch (error: any) {
        console.error("Guest create subscription payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmGuestSubscriptionPayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId, guestToken } = req.body;

        if (!paymentIntentId || !guestToken) {
            return res.status(400).json({ error: "paymentIntentId and guestToken are required" });
        }

        let payload: GuestTokenPayload;
        try {
            payload = verifyGuestToken(guestToken);
        } catch {
            return res.status(401).json({ error: "Invalid or expired guest token" });
        }

        if (payload.paymentIntentId !== paymentIntentId) {
            return res.status(403).json({ error: "Token does not match payment intent" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }
        if (paymentIntent.metadata.userId !== payload.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { data: existing } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ message: "Subscription already activated", alreadyActivated: true });
        }

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        const guestProgramType = paymentIntent.metadata.programType as ProgramType;
        if (!guestProgramType || !VALID_PROGRAM_TYPES.includes(guestProgramType)) {
            return res.status(400).json({ error: "Missing or invalid programType in payment metadata" });
        }

        const { data: subscription, error: subError } = await supabaseAdmin
            .from("user_subscriptions")
            .insert({
                user_id: payload.userId,
                program_type: guestProgramType,
                status: "active",
                group_sessions_remaining: 12,
                individual_sessions_remaining: 8,
                price_paid: SUBSCRIPTION_PRICE_USD,
                stripe_payment_intent_id: paymentIntentId,
                started_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (subError) {
            return res.status(400).json({ error: subError.message });
        }

        await sendPasswordSetupEmail(payload.email);

        return res.status(201).json({
            message: "90 Circle subscription activated successfully",
            subscription,
            isNewUser: true,
        });
    } catch (error: any) {
        console.error("Confirm guest subscription payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Guest Session Package Payment ====================

export const createGuestSessionPackagePaymentIntent = async (req: Request, res: Response) => {
    try {
        const { packageType, category, email, firstName, lastName } = req.body;

        if (!email) {
            return res.status(400).json({ error: "email is required" });
        }

        if (!["3_sessions", "6_sessions"].includes(packageType)) {
            return res.status(400).json({ error: "Invalid package type. Must be '3_sessions' or '6_sessions'" });
        }

        if (!["gold_forex", "crypto"].includes(category)) {
            return res.status(400).json({ error: "Invalid category. Must be 'gold_forex' or 'crypto'" });
        }

        const { userId, isNewUser, userEmail } = await findOrCreateGuestUser(email, firstName, lastName);

        const price = SESSION_PACKAGE_PRICES[packageType];

        const paymentIntent = await stripe.paymentIntents.create({
            amount: price * 100,
            currency: "usd",
            metadata: { userId, type: "session_package", packageType, category },
            automatic_payment_methods: { enabled: true },
        });

        const guestToken = signGuestToken(userId, paymentIntent.id, userEmail);

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            guestToken,
            isNewUser,
            finalPrice: price.toFixed(2),
        });
    } catch (error: any) {
        console.error("Guest create session package payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const confirmGuestSessionPackagePayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId, guestToken } = req.body;

        if (!paymentIntentId || !guestToken) {
            return res.status(400).json({ error: "paymentIntentId and guestToken are required" });
        }

        let payload: GuestTokenPayload;
        try {
            payload = verifyGuestToken(guestToken);
        } catch {
            return res.status(401).json({ error: "Invalid or expired guest token" });
        }

        if (payload.paymentIntentId !== paymentIntentId) {
            return res.status(403).json({ error: "Token does not match payment intent" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment not completed" });
        }
        if (paymentIntent.metadata.userId !== payload.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { data: existing } = await supabaseAdmin
            .from("user_session_packages")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ message: "Package already recorded", alreadyRecorded: true });
        }

        const packageType = paymentIntent.metadata.packageType;
        const category = paymentIntent.metadata.category;
        const sessionsTotal = SESSION_PACKAGE_COUNTS[packageType];
        const price = SESSION_PACKAGE_PRICES[packageType];

        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from("user_session_packages")
            .insert({
                user_id: payload.userId,
                category,
                package_type: packageType,
                sessions_total: sessionsTotal,
                sessions_remaining: sessionsTotal,
                price_paid: price,
                stripe_payment_intent_id: paymentIntentId,
                purchased_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (pkgError) {
            return res.status(400).json({ error: pkgError.message });
        }

        await sendPasswordSetupEmail(payload.email);

        return res.status(201).json({
            message: "Session package purchased successfully",
            package: pkg,
            isNewUser: true,
        });
    } catch (error: any) {
        console.error("Confirm guest session package payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Webhook Handler ====================

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ error: "Missing signature or webhook secret" });
    }

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('PaymentIntent was successful!', paymentIntent.id);
                // Additional logic can be added here
                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log('PaymentIntent failed!', failedPayment.id);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error('Webhook Error:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
};
