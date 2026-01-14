import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import { supabaseAdmin } from "../config/supabase";

// ==================== Course Payment ====================

export const createCoursePaymentIntent = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.body;
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

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(course.price) * 100), // Convert to cents
            currency: "usd",
            metadata: {
                userId: userData.user.id,
                courseId: course.id,
                courseTitle: course.title,
                type: "course",
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
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

        // Create enrollment record
        const { data: purchase, error: purchaseError } = await supabaseAdmin
            .from("user_courses")
            .insert({
                user_id: userId,
                course_id: courseId,
                price_paid: course?.price || 0,
            })
            .select()
            .single();

        if (purchaseError) {
            return res.status(400).json({ error: purchaseError.message });
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
        const { sessionId } = req.body;
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

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(session.price) * 100), // Convert to cents
            currency: "usd",
            metadata: {
                userId: userData.user.id,
                sessionId: session.id,
                sessionTitle: session.title,
                type: "live_session",
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
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

        // Create enrollment record
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from("user_live_sessions")
            .insert({
                user_id: userId,
                session_id: sessionId,
                price_paid: session?.price || 0,
            })
            .select()
            .single();

        if (enrollmentError) {
            return res.status(400).json({ error: enrollmentError.message });
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
