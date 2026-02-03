import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { randomUUID } from "crypto";
import * as XLSX from "xlsx";
import { createRoom, isDailyConfigured } from "../services/dailyService";

// ==================== Dashboard Statistics ====================

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Get total users count
        const { count: totalUsers } = await supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true });

        // Get total courses count
        const { count: totalCourses } = await supabaseAdmin
            .from("courses")
            .select("*", { count: "exact", head: true });

        // Get total enrollments
        const { count: totalEnrollments } = await supabaseAdmin
            .from("user_courses")
            .select("*", { count: "exact", head: true });

        // Get active live sessions count
        const { count: activeSessions } = await supabaseAdmin
            .from("live_sessions")
            .select("*", { count: "exact", head: true })
            .in("status", ["scheduled", "live"]);

        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: newUsers } = await supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo.toISOString());

        // Calculate total revenue (sum of all course purchases)
        const { data: purchases } = await supabaseAdmin
            .from("user_courses")
            .select("courses(price)");

        const totalRevenue = purchases?.reduce((sum, purchase: any) => {
            return sum + (purchase.courses?.price || 0);
        }, 0) || 0;

        return res.status(200).json({
            totalUsers: totalUsers || 0,
            totalCourses: totalCourses || 0,
            totalEnrollments: totalEnrollments || 0,
            activeSessions: activeSessions || 0,
            newUsers: newUsers || 0,
            totalRevenue,
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const { limit = 10 } = req.query;
        const activities: any[] = [];

        // Get recent user registrations
        const { data: recentUsers } = await supabaseAdmin
            .from("users")
            .select("id, email, first_name, last_name, created_at")
            .order("created_at", { ascending: false })
            .limit(Number(limit));

        if (recentUsers) {
            recentUsers.forEach((user) => {
                activities.push({
                    id: `user-${user.id}`,
                    type: "user_registration",
                    description: `New user registration: ${user.first_name || ""} ${user.last_name || ""} (${user.email})`,
                    timestamp: user.created_at,
                    metadata: {
                        userId: user.id,
                        userName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
                        userEmail: user.email,
                    },
                });
            });
        }

        // Get recent course purchases
        const { data: recentPurchases } = await supabaseAdmin
            .from("user_courses")
            .select(`
                id,
                created_at,
                user_id,
                course_id,
                users:user_id(first_name, last_name, email),
                courses:course_id(title, price)
            `)
            .order("created_at", { ascending: false })
            .limit(Number(limit));

        if (recentPurchases) {
            recentPurchases.forEach((purchase: any) => {
                const userName = purchase.users
                    ? `${purchase.users.first_name || ""} ${purchase.users.last_name || ""}`.trim() || purchase.users.email
                    : "Unknown User";
                const courseTitle = purchase.courses?.title || "Unknown Course";
                const coursePrice = purchase.courses?.price || 0;

                activities.push({
                    id: `purchase-${purchase.id}`,
                    type: "course_purchase",
                    description: `Course purchased: ${courseTitle} by ${userName} ($${coursePrice})`,
                    timestamp: purchase.created_at,
                    metadata: {
                        userId: purchase.user_id,
                        userName,
                        courseId: purchase.course_id,
                        courseTitle,
                        price: coursePrice,
                    },
                });
            });
        }

        // Get recent live session schedules
        const { data: recentSessions } = await supabaseAdmin
            .from("live_sessions")
            .select(`
                id,
                title,
                scheduled_at,
                created_at,
                course_id,
                courses:course_id(title)
            `)
            .order("created_at", { ascending: false })
            .limit(Number(limit));

        if (recentSessions) {
            recentSessions.forEach((session: any) => {
                const courseTitle = session.courses?.title || "Unknown Course";
                activities.push({
                    id: `session-${session.id}`,
                    type: "live_session_scheduled",
                    description: `Live session scheduled: ${session.title} for ${courseTitle}`,
                    timestamp: session.created_at,
                    metadata: {
                        sessionId: session.id,
                        sessionTitle: session.title,
                        courseId: session.course_id,
                        courseTitle,
                        scheduledAt: session.scheduled_at,
                    },
                });
            });
        }

        // Sort all activities by timestamp (most recent first)
        activities.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        // Return the most recent activities (limited)
        return res.status(200).json({
            activities: activities.slice(0, Number(limit)),
        });
    } catch (error: any) {
        console.error("Error fetching recent activity:", error);
        return res.status(500).json({ error: error.message });
    }
};

// ==================== User Management ====================

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = "", role = "" } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from("users")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false });

        // Apply search filter
        if (search) {
            query = query.or(
                `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
            );
        }

        // Apply role filter
        if (role) {
            query = query.eq("role", role);
        }

        // Apply pagination
        query = query.range(offset, offset + Number(limit) - 1);

        const { data: users, error, count } = await query;
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({
            users,
            pagination: {
                total: count || 0,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil((count || 0) / Number(limit)),
            },
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get user's enrolled courses
        const { data: enrollments } = await supabaseAdmin
            .from("user_courses")
            .select("*, courses(*)")
            .eq("user_id", id);

        return res.status(200).json({
            user,
            enrollments: enrollments || [],
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["admin", "instructor", "student"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const { data, error } = await supabaseAdmin
            .from("users")
            .update({ role, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ user: data });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Delete from auth (will cascade to users table)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Course Management ====================

export const createCourse = async (req: Request, res: Response) => {
    try {
        const {
            title,
            description,
            price,
            level, // maps to level
            thumbnail_url, // maps to thumbnail
            is_published,
            duration,
            instructor,
            instructor_avatar,
            features = [],
            requirements = [],
            what_you_learn = [],
            lessons = [], // Array of lesson objects
        } = req.body;

        console.log(title, description, price, level, thumbnail_url, is_published, duration, instructor, instructor_avatar, features, requirements, what_you_learn, lessons);
        if (!title || !description || price === undefined || !instructor || !duration) {
            return res.status(400).json({ error: "Missing required fields: title, description, price, instructor, duration" });
        }

        // Validate lessons array
        if (!Array.isArray(lessons)) {
            return res.status(400).json({ error: "lessons must be an array" });
        }

        const courseId = randomUUID();

        const { data: course, error } = await supabaseAdmin
            .from("courses")
            .insert({
                id: courseId,
                title,
                description,
                price: Number(price),
                level: level || "Beginner", // Schema uses 'level'
                thumbnail: thumbnail_url || "", // Schema uses 'thumbnail'
                duration,
                instructor,
                instructor_avatar: instructor_avatar || null,
                features,
                requirements,
                what_you_learn,
                lessons_count: lessons.length,
                rating: 0,
                students: 0,
                is_published: is_published || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.log(error);
            return res.status(400).json({ error: error.message });
        }

        // Create lessons if provided
        if (lessons.length > 0) {
            const lessonsToInsert = lessons.map((lesson: any, index: number) => ({
                id: randomUUID(),
                course_id: courseId,
                course_title: title,
                title: lesson.title || `Lesson ${index + 1}`,
                duration: lesson.duration || "0:00",
                video_url: lesson.video_url || null,
                is_preview: lesson.is_preview || false,
                order_index: lesson.order_index || index + 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));

            const { error: lessonsError } = await supabaseAdmin
                .from("lessons")
                .insert(lessonsToInsert);

            if (lessonsError) {
                console.log("Error creating lessons:", lessonsError);
                // Rollback: delete the course if lessons creation fails
                await supabaseAdmin.from("courses").delete().eq("id", courseId);
                return res.status(400).json({ error: `Course created but lessons failed: ${lessonsError.message}` });
            }
        }

        return res.status(201).json({ course });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { lessons = [], ...courseData } = req.body;

        // Validate lessons array
        if (!Array.isArray(lessons)) {
            return res.status(400).json({ error: "lessons must be an array" });
        }

        // Prepare course update data
        const updateData = {
            ...courseData,
            lessons_count: lessons.length,
            updated_at: new Date().toISOString()
        };

        // Update the course
        const { data: course, error } = await supabaseAdmin
            .from("courses")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.log(error);
            return res.status(400).json({ error: error.message });
        }

        // Handle lessons update if lessons array is provided
        if (lessons.length >= 0) {
            // Delete existing lessons for this course
            const { error: deleteError } = await supabaseAdmin
                .from("lessons")
                .delete()
                .eq("course_id", id);

            if (deleteError) {
                console.log("Error deleting old lessons:", deleteError);
                return res.status(400).json({ error: `Failed to delete old lessons: ${deleteError.message}` });
            }

            // Insert new lessons if any
            const lessonsToInsert = lessons.map((lesson: any, index: number) => ({
                id: randomUUID(),
                course_id: id,
                course_title: course.title,
                title: lesson.title || `Lesson ${index + 1}`,
                duration: lesson.duration || "0:00",
                video_url: lesson.video_url || null,
                is_preview: lesson.is_preview || false,
                order_index: lesson.order_index || index + 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));

            const { error: lessonsError } = await supabaseAdmin
                .from("lessons")
                .insert(lessonsToInsert);

            if (lessonsError) {
                console.log("Error creating lessons:", lessonsError);
                return res.status(400).json({ error: `Course updated but lessons failed: ${lessonsError.message}` });
            }
        }

        return res.status(200).json({ course });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from("courses")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: "Course deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Live Session Management ====================

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

export const getLiveSessions = async (req: Request, res: Response) => {
    try {
        const { status, course_id } = req.query;

        let query = supabaseAdmin
            .from("live_sessions")
            .select("*, courses(title), users!instructor_id(first_name, last_name, email)")
            .order("scheduled_at", { ascending: true });

        if (course_id) {
            query = query.eq("course_id", course_id);
        }

        const { data: sessions, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Calculate status for each session and update database if needed
        const updatedSessions = await Promise.all(
            (sessions || []).map(async (session) => await updateSessionStatus(session))
        );
        let sessionsWithStatus = updatedSessions;

        // Apply status filter after calculating status
        if (status) {
            sessionsWithStatus = sessionsWithStatus.filter(
                (session) => session.status === status
            );
        }

        return res.status(200).json({ sessions: sessionsWithStatus });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createLiveSession = async (req: Request, res: Response) => {
    try {
        const {
            course_id,
            title,
            description,
            scheduled_at,
            duration,
            meeting_url,
            instructor_id,
            max_participants,
            price,
        } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        if (!course_id || !title || !scheduled_at) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Calculate initial status based on scheduled time
        const initialStatus = calculateSessionStatus(scheduled_at, duration || 60);
        const durationMinutes = duration || 60;

        //current user id
        
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const currentUserId = userData.user.id;

        // Insert session first (without video room; we get id then create room)
        const { data: session, error } = await supabaseAdmin
            .from("live_sessions")
            .insert({
                course_id,
                title,
                description: description || null,
                scheduled_at,
                duration: durationMinutes,
                meeting_url: meeting_url || null,
                instructor_id: currentUserId || null,
                max_participants: max_participants || null,
                price: price || 0,
                status: initialStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.log("Error creating live session:", error);
            return res.status(400).json({ error: error.message });
        }

        // Create Daily.co room and store video_room_name + video_provider
        if (isDailyConfigured()) {
            try {
                const roomName = `session-${session.id}`.replace(/[^A-Za-z0-9_-]/g, "-");
                const room = await createRoom({
                    roomName,
                    scheduledAt: scheduled_at,
                    durationMinutes,
                    maxParticipants: max_participants ? parseInt(String(max_participants), 10) : undefined,
                });
                await supabaseAdmin
                    .from("live_sessions")
                    .update({
                        video_room_name: room.name,
                        video_provider: "daily",
                        meeting_url: room.url,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", session.id);
                session.video_room_name = room.name;
                session.video_provider = "daily";
                session.meeting_url = room.url;
            } catch (dailyError: any) {
                console.error("Daily room creation failed:", dailyError);
                return res.status(500).json({
                    error: "Session created but video room could not be created. Please try again or add a meeting URL manually.",
                });
            }
        }

        return res.status(201).json({ session });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateLiveSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { meeting_url, video_room_name, video_provider, ...rest } = req.body;
        // Do not allow updating video room or provider from client; only meeting_url for backward compat
        const updateData: Record<string, unknown> = {
            ...rest,
            updated_at: new Date().toISOString(),
        };
        if (meeting_url !== undefined) updateData.meeting_url = meeting_url || null;

        // Check if scheduled_at or duration are being updated (these affect status)
        const statusAffectingFields = ['scheduled_at', 'duration'];
        const shouldRecalculateStatus = statusAffectingFields.some(field => field in req.body);

        const { data: session, error } = await supabaseAdmin
            .from("live_sessions")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Recalculate and update status if scheduled_at or duration were changed
        if (shouldRecalculateStatus && session) {
            const updatedSession = await updateSessionStatus(session);
            return res.status(200).json({ session: updatedSession });
        }

        return res.status(200).json({ session });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteLiveSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from("live_sessions")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: "Live session deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// ==================== Checklist Submissions Management ====================

export const getChecklistSubmissions = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = "", stage = "", sortBy = "created_at", sortOrder = "desc" } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from("checklist_responses")
            .select("*", { count: "exact" })
            .order(sortBy as string, { ascending: sortOrder === "asc" });

        // Apply search filter
        if (search) {
            query = query.or(
                `full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`
            );
        }

        // Apply stage filter
        if (stage) {
            query = query.eq("stage", stage);
        }

        // Apply pagination
        query = query.range(offset, offset + Number(limit) - 1);

        const { data: submissions, error, count } = await query;

        if (error) {
            console.log(error);
            return res.status(400).json({ error: error.message });
        }

        // Get overall statistics (without filters)
        const { data: allSubmissions } = await supabaseAdmin
            .from("checklist_responses")
            .select("stage, score");

        const stats = {
            total: allSubmissions?.length || 0,
            byStage: {
                awareness: allSubmissions?.filter((s) => s.stage === "awareness").length || 0,
                builder: allSubmissions?.filter((s) => s.stage === "builder").length || 0,
                professional: allSubmissions?.filter((s) => s.stage === "professional").length || 0,
                investor: allSubmissions?.filter((s) => s.stage === "investor").length || 0,
            },
            avgScore: 0,
        };

        // Calculate average score
        if (allSubmissions && allSubmissions.length > 0) {
            const validScores = allSubmissions
                .map((s) => parseFloat(s.score))
                .filter((score) => !isNaN(score));
            if (validScores.length > 0) {
                stats.avgScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
            }
        }

        return res.status(200).json({
            submissions: submissions || [],
            pagination: {
                total: count || 0,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil((count || 0) / Number(limit)),
            },
            stats,
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getChecklistSubmissionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: submission, error } = await supabaseAdmin
            .from("checklist_responses")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        return res.status(200).json({ submission });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const exportChecklistSubmissionsToExcel = async (req: Request, res: Response) => {
    try {
        const { search = "", stage = "" } = req.query;

        let query = supabaseAdmin
            .from("checklist_responses")
            .select("*")
            .order("created_at", { ascending: false });

        // Apply search filter
        if (search) {
            query = query.or(
                `full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`
            );
        }

        // Apply stage filter
        if (stage) {
            query = query.eq("stage", stage);
        }

        const { data: submissions, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ error: "No submissions found to export" });
        }

        // Transform data for Excel export
        const excelData = submissions.map((submission, index) => {
            const row: any = {
                "#": index + 1,
                "Full Name": submission.full_name || "",
                "Email": submission.email || "",
                "Phone Number": submission.phone_number || "",
                "Age": submission.age || "",
                "Country": submission.country || "",
                "Score": submission.score || "",
                "Stage": submission.stage ? submission.stage.charAt(0).toUpperCase() + submission.stage.slice(1) : "",
                "Submitted At": submission.created_at ? new Date(submission.created_at).toLocaleString() : "",
            };

            // Add answers as separate columns
            if (submission.answers && Array.isArray(submission.answers)) {
                submission.answers.forEach((answer: any, idx: number) => {
                    row[`Q${idx + 1} - ${answer.question || `Question ${idx + 1}`}`] = answer.answer || "";
                });
            }

            return row;
        });

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths for better readability
        const columnWidths = [
            { wch: 5 },   // #
            { wch: 25 },  // Full Name
            { wch: 30 },  // Email
            { wch: 15 },  // Phone Number
            { wch: 8 },   // Age
            { wch: 20 },  // Country
            { wch: 10 },  // Score
            { wch: 15 },  // Stage
            { wch: 20 },  // Submitted At
        ];

        // Add widths for answer columns if they exist
        if (submissions[0]?.answers && Array.isArray(submissions[0].answers)) {
            submissions[0].answers.forEach(() => {
                columnWidths.push({ wch: 40 }); // Question columns
            });
        }

        worksheet["!cols"] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Checklist Submissions");

        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });

        // Set response headers for file download
        const filename = `checklist_submissions_${new Date().toISOString().split("T")[0]}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        return res.status(200).send(excelBuffer);
    } catch (error: any) {
        console.error("Export error:", error);
        return res.status(500).json({ error: error.message });
    }
};
