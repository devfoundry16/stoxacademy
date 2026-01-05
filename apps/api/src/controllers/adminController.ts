import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { randomUUID } from "node:crypto";

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
            if (lessons.length > 0) {
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

export const getLiveSessions = async (req: Request, res: Response) => {
    try {
        const { status, course_id } = req.query;

        let query = supabaseAdmin
            .from("live_sessions")
            .select("*, courses(title), users!instructor_id(first_name, last_name, email)")
            .order("scheduled_at", { ascending: true });

        if (status) {
            query = query.eq("status", status);
        }

        if (course_id) {
            query = query.eq("course_id", course_id);
        }

        const { data: sessions, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ sessions });
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
        } = req.body;

        if (!course_id || !title || !scheduled_at) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { data: session, error } = await supabaseAdmin
            .from("live_sessions")
            .insert({
                course_id,
                title,
                description: description || null,
                scheduled_at,
                duration: duration || 60,
                meeting_url: meeting_url || null,
                instructor_id: instructor_id || null,
                max_participants: max_participants || null,
                status: "scheduled",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ session });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateLiveSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, updated_at: new Date().toISOString() };

        const { data: session, error } = await supabaseAdmin
            .from("live_sessions")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
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
