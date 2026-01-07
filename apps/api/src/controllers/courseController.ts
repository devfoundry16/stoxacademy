import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const { level, sortBy } = req.query;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    let query = supabaseAdmin
      .from("courses")
      .select("*")
      .eq("is_published", true);

    // Filter by level
    if (level && level !== "All") {
      query = query.eq("level", level);
    }

    // Execute query
    const { data: courses, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if user has purchased any courses
    let purchasedCourseIds: string[] = [];
    if (token) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

      if (!userError && userData.user) {
        const { data: purchases } = await supabaseAdmin
          .from("user_courses")
          .select("course_id")
          .eq("user_id", userData.user.id);

        if (purchases) {
          purchasedCourseIds = purchases.map((p) => p.course_id);
        }
      }
    }

    // Add isPurchased field to each course
    let sortedCourses = (courses || []).map((course) => ({
      ...course,
      isPurchased: purchasedCourseIds.includes(course.id),
    }));

    // Sort courses
    if (sortBy === "popular") {
      sortedCourses = sortedCourses.sort((a, b) => b.students - a.students);
    } else if (sortBy === "rating") {
      sortedCourses = sortedCourses.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price-low") {
      sortedCourses = sortedCourses.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === "price-high") {
      sortedCourses = sortedCourses.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    return res.status(200).json({ courses: sortedCourses });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Get lessons for this course
    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      return res.status(400).json({ error: lessonsError.message });
    }

    // Check if user has purchased this course
    let isPurchased = false;
    if (token) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

      if (!userError && userData.user) {
        const { data: purchase } = await supabaseAdmin
          .from("user_courses")
          .select("id")
          .eq("user_id", userData.user.id)
          .eq("course_id", id)
          .single();

        isPurchased = !!purchase;
      }
    }

    return res.status(200).json({
      course: {
        ...course,
        isPurchased,
        lessons: lessons || [],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const purchaseCourse = async (req: Request, res: Response) => {
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

    // Get course price
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("price")
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

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("user_courses")
      .insert({
        user_id: userData.user.id,
        course_id: courseId,
        price_paid: course.price,
      })
      .select()
      .single();

    if (purchaseError) {
      return res.status(400).json({ error: purchaseError.message });
    }

    // Increment the students count for the course
    // Get current student count
    const { data: currentCourse } = await supabaseAdmin
      .from("courses")
      .select("students")
      .eq("id", courseId)
      .single();

    if (currentCourse) {
      const newStudentCount = (currentCourse.students || 0) + 1;

      // Update student count (don't fail purchase if this fails, just log it)
      const { error: updateError } = await supabaseAdmin
        .from("courses")
        .update({ 
          students: newStudentCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", courseId);

      if (updateError) {
        console.error('Failed to update student count:', updateError);
        // Don't fail the purchase, just log the error
      }
    }

    return res.status(201).json({
      message: "Course purchased successfully",
      purchase,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUserCourses = async (req: Request, res: Response) => {
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

    // Get user's purchased courses
    const { data: userCourses, error } = await supabaseAdmin
      .from("user_courses")
      .select(`
        *,
        courses (*)
      `)
      .eq("user_id", userData.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ courses: userCourses });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateLessonProgress = async (req: Request, res: Response) => {
  try {
    const { lessonId, completed } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Upsert progress
    const { data: progress, error: progressError } = await supabaseAdmin
      .from("user_lesson_progress")
      .upsert({
        user_id: userData.user.id,
        lesson_id: lessonId,
        completed: completed || false,
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single();

    if (progressError) {
      return res.status(400).json({ error: progressError.message });
    }

    return res.status(200).json({ progress });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
export const getCourseLessons = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get course lessons
    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      console.log(lessonsError);
      return res.status(400).json({ error: lessonsError.message });
    }

    return res.status(200).json({ lessons });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

