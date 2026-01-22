import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

// ==================== Helper Functions ====================

/**
 * Calculate live session status based on scheduled time and duration
 */
const calculateSessionStatus = (scheduledAt: string, durationMinutes: number): string => {
    const now = new Date();
    const scheduledDate = new Date(scheduledAt);
    const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000);

    if (now < scheduledDate) {
        return 'scheduled';
    } else if (now >= scheduledDate && now < endDate) {
        return 'live';
    } else {
        return 'completed';
    }
};

/**
 * Update session with calculated status and persist to database if changed
 */
const updateSessionStatus = async (session: any) => {
    if (!session) return session;
    
    const calculatedStatus = calculateSessionStatus(session.scheduled_at, session.duration);
    
    // Update database if status has changed
    if (session.status !== calculatedStatus) {
        await supabaseAdmin
            .from("live_sessions")
            .update({ 
                status: calculatedStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", session.id);
    }
    
    return {
        ...session,
        status: calculatedStatus
    };
};

// ==================== Public Live Session Routes ====================

export const getAllLiveSessions = async (req: Request, res: Response) => {
    try {
        const { status, course_id } = req.query;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        let userId: string | null = null;

        // Get user ID if authenticated
        if (token) {
            const { data: userData } = await supabaseAdmin.auth.getUser(token);
            if (userData.user) {
                userId = userData.user.id;
            }
        }

        let query = supabaseAdmin
            .from("live_sessions")
            .select("*, courses(title, id)")
            .order("scheduled_at", { ascending: true });

        // Apply course filter
        if (course_id) {
            query = query.eq("course_id", course_id);
        }

        const { data: sessions, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Check which sessions the user has enrolled in
        let enrolledSessionIds: string[] = [];
        if (userId) {
            const { data: enrollments } = await supabaseAdmin
                .from("user_live_sessions")
                .select("session_id")
                .eq("user_id", userId);

            if (enrollments) {
                enrolledSessionIds = enrollments.map((e) => e.session_id);
            }
        }

        // Calculate status for each session and add isEnrolled field
        const updatedSessions = await Promise.all(
            (sessions || []).map(async (session) => await updateSessionStatus(session))
        );
        
        let sessionsWithEnrollment = updatedSessions.map((updatedSession) => {
            return {
                ...updatedSession,
                isEnrolled: enrolledSessionIds.includes(updatedSession.id),
            };
        });

        // Apply status filter after calculating status
        if (status) {
            sessionsWithEnrollment = sessionsWithEnrollment.filter(
                (session) => session.status === status
            );
        }

        return res.status(200).json({ sessions: sessionsWithEnrollment });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getLiveSessionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        let userId: string | null = null;

        // Get user ID if authenticated
        if (token) {
            const { data: userData } = await supabaseAdmin.auth.getUser(token);
            if (userData.user) {
                userId = userData.user.id;
            }
        }

        const { data: session, error } = await supabaseAdmin
            .from("live_sessions")
            .select("*, courses(title, id, description, instructor)")
            .eq("id", id)
            .single();

        if (error || !session) {
            return res.status(404).json({ error: "Live session not found" });
        }

        // Calculate the current status based on scheduled time and duration
        const updatedSession = await updateSessionStatus(session);

        // Check if user has enrolled
        let isEnrolled = false;
        if (userId) {
            const { data: enrollment } = await supabaseAdmin
                .from("user_live_sessions")
                .select("id")
                .eq("user_id", userId)
                .eq("session_id", id)
                .single();

            isEnrolled = !!enrollment;
        }

        return res.status(200).json({
            session: {
                ...updatedSession,
                isEnrolled,
            },
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const enrollInLiveSession = async (req: Request, res: Response) => {
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

        // Get session price
        const { data: session, error: sessionError } = await supabaseAdmin
            .from("live_sessions")
            .select("price, max_participants, participants_count")
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

        // Create enrollment record
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from("user_live_sessions")
            .insert({
                user_id: userData.user.id,
                session_id: sessionId,
                price_paid: session.price,
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
        return res.status(500).json({ error: error.message });
    }
};

export const getUserLiveSessions = async (req: Request, res: Response) => {
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

        // Get user's enrolled live sessions
        const { data: enrollments, error } = await supabaseAdmin
            .from("user_live_sessions")
            .select(`
                *,
                live_sessions:session_id (
                    *,
                    courses (title, id)
                )
            `)
            .eq("user_id", userData.user.id)
            .order("purchased_at", { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Calculate status for each enrolled session
        const enrollmentsWithStatus = await Promise.all(
            (enrollments || []).map(async (enrollment) => {
                if (enrollment.live_sessions) {
                    const updatedSession = await updateSessionStatus(enrollment.live_sessions);
                    return {
                        ...enrollment,
                        live_sessions: updatedSession,
                    };
                }
                return enrollment;
            })
        );

        return res.status(200).json({ enrollments: enrollmentsWithStatus });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
