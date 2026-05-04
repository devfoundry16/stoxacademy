import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { supabaseAdmin } from "../config/supabase";
import { incrementCouponUsage } from "./couponController";

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

export const createSubscriptionPaymentIntent = async (req: Request, res: Response) => {
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

        // Check for an existing active subscription
        const now = new Date().toISOString();
        const { data: existingSub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id, expires_at")
            .eq("user_id", userData.user.id)
            .eq("status", "active")
            .gt("expires_at", now)
            .maybeSingle();

        if (existingSub) {
            return res.status(400).json({ error: "You already have an active 90 Circle subscription" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: SUBSCRIPTION_PRICE_USD * 100,
            currency: "usd",
            metadata: {
                userId: userData.user.id,
                type: "subscription",
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

        const { data: subscription, error: subError } = await supabaseAdmin
            .from("user_subscriptions")
            .insert({
                user_id: userData.user.id,
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

        // Get active subscription
        const { data: subscription } = await supabaseAdmin
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", userData.user.id)
            .eq("status", "active")
            .gt("expires_at", now)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        // Get all session packages for this user
        const { data: packages } = await supabaseAdmin
            .from("user_session_packages")
            .select("*")
            .eq("user_id", userData.user.id)
            .gt("sessions_remaining", 0)
            .order("purchased_at", { ascending: false });

        return res.status(200).json({
            subscription: subscription || null,
            sessionPackages: packages || [],
        });
    } catch (error: any) {
        console.error("Get subscription status error:", error);
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
