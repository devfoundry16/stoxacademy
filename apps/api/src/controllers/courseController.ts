import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

async function hasActiveSubscription(userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const { data } = await supabaseAdmin
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();
    return !!data;
}

/**
 * Nests sub-lessons inside their parent lessons.
 * Returns only top-level lessons with a `sub_lessons` array.
 */
function nestLessons(lessons: any[]): any[] {
    const topLevel = lessons.filter((l) => !l.parent_lesson_id);
    const subLessons = lessons.filter((l) => l.parent_lesson_id);

    return topLevel.map((parent) => ({
        ...parent,
        sub_lessons: subLessons
            .filter((s) => s.parent_lesson_id === parent.id)
            .sort((a, b) => a.order_index - b.order_index),
    }));
}

/**
 * Returns all trackable lesson IDs: top-level lessons that have a video,
 * plus all sub-lessons (which may have video and/or notes).
 */
function getTrackableLessonIds(lessons: any[]): string[] {
    const ids: string[] = [];
    for (const lesson of lessons) {
        if (!lesson.parent_lesson_id && lesson.video_url) {
            ids.push(lesson.id);
        } else if (lesson.parent_lesson_id) {
            ids.push(lesson.id);
        }
    }
    return ids;
}

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

    // Check if user has purchased any courses (or has an active subscription)
    let purchasedCourseIds: string[] = [];
    let subscriptionActive = false;
    if (token) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

      if (!userError && userData.user) {
        subscriptionActive = await hasActiveSubscription(userData.user.id);

        if (!subscriptionActive) {
          const { data: purchases } = await supabaseAdmin
            .from("user_courses")
            .select("course_id")
            .eq("user_id", userData.user.id);

          if (purchases) {
            purchasedCourseIds = purchases.map((p) => p.course_id);
          }
        }
      }
    }

    // Add isPurchased field to each course (subscription grants access to all courses)
    let sortedCourses = (courses || []).map((course) => ({
      ...course,
      isPurchased: subscriptionActive || purchasedCourseIds.includes(course.id),
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

    // Get all lessons and sub-lessons for this course
    const { data: allLessons, error: lessonsError } = await supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      return res.status(400).json({ error: lessonsError.message });
    }

    // Check if user has purchased this course (or has an active subscription) and get lesson progress
    let isPurchased = false;
    let flatLessons = allLessons || [];

    if (token) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

      if (!userError && userData.user) {
        // Active subscription grants access to all courses
        const subscriptionActive = await hasActiveSubscription(userData.user.id);

        if (subscriptionActive) {
          isPurchased = true;
        } else {
          const { data: purchase } = await supabaseAdmin
            .from("user_courses")
            .select("id")
            .eq("user_id", userData.user.id)
            .eq("course_id", id)
            .single();

          isPurchased = !!purchase;
        }

        // Track progress for top-level lessons with video and all sub-lessons
        const trackableIds = getTrackableLessonIds(flatLessons);
        if (trackableIds.length > 0) {
          const { data: progress } = await supabaseAdmin
            .from("user_lesson_progress")
            .select("*")
            .eq("user_id", userData.user.id)
            .in("lesson_id", trackableIds);

          flatLessons = flatLessons.map(lesson => {
            const lessonProgress = progress?.find(p => p.lesson_id === lesson.id);
            return {
              ...lesson,
              completed: lessonProgress?.completed || false,
              lastWatchedAt: lessonProgress?.last_watched_at || null,
            };
          });
        }
      }
    }

    return res.status(200).json({
      course: {
        ...course,
        isPurchased,
        lessons: nestLessons(flatLessons),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const purchaseCourse = async (req: Request, res: Response) => {
  try {
    const { courseId, couponCode, discountPercentage, originalPrice } = req.body;
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

    // Calculate actual price paid (with discount if applicable)
    let pricePaid = parseFloat(course.price);
    if (discountPercentage && discountPercentage > 0) {
      pricePaid = pricePaid * (1 - discountPercentage / 100);
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("user_courses")
      .insert({
        user_id: userData.user.id,
        course_id: courseId,
        price_paid: pricePaid,
        coupon_code: couponCode || null,
        discount_percentage: discountPercentage || null,
        original_price: originalPrice || parseFloat(course.price),
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
      .eq("user_id", userData.user.id)
      .order("purchased_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Calculate progress for each course
    const coursesWithProgress = await Promise.all(
      (userCourses || []).map(async (userCourse) => {
        const courseId = userCourse.course_id;

        // Get all lessons (including sub-lessons) for this course
        const { data: lessons } = await supabaseAdmin
          .from("lessons")
          .select("id, parent_lesson_id, video_url")
          .eq("course_id", courseId);

        // Only track top-level lessons with video and all sub-lessons
        const trackableIds = getTrackableLessonIds(lessons || []);
        const totalLessons = trackableIds.length;

        // Get completed trackable lessons count for this user
        const { data: completedLessons } = await supabaseAdmin
          .from("user_lesson_progress")
          .select("lesson_id")
          .eq("user_id", userData.user.id)
          .eq("completed", true)
          .in("lesson_id", trackableIds.length > 0 ? trackableIds : ["__none__"]);

        const completedCount = completedLessons?.length || 0;
        const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        return {
          ...userCourse,
          progress: {
            totalLessons,
            completedLessons: completedCount,
            remainingLessons: totalLessons - completedCount,
            progressPercentage,
          },
        };
      })
    );

    return res.status(200).json({ courses: coursesWithProgress });
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

    // Get all lessons and sub-lessons for this course
    const { data: allLessons, error: lessonsError } = await supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      console.log(lessonsError);
      return res.status(400).json({ error: lessonsError.message });
    }

    // Get progress for trackable lessons (top-level with video + all sub-lessons)
    const trackableIds = getTrackableLessonIds(allLessons || []);
    const { data: progress } = await supabaseAdmin
      .from("user_lesson_progress")
      .select("*")
      .eq("user_id", userData.user.id)
      .in("lesson_id", trackableIds.length > 0 ? trackableIds : ["__none__"]);

    const flatWithProgress = (allLessons || []).map(lesson => {
      const lessonProgress = progress?.find(p => p.lesson_id === lesson.id);
      return {
        ...lesson,
        completed: lessonProgress?.completed || false,
        lastWatchedAt: lessonProgress?.last_watched_at || null,
      };
    });

    return res.status(200).json({ lessons: nestLessons(flatWithProgress) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCourseProgress = async (req: Request, res: Response) => {
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

    // Check if user has purchased this course
    const { data: purchase } = await supabaseAdmin
      .from("user_courses")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("course_id", id)
      .single();

    if (!purchase) {
      return res.status(403).json({ error: "Course not purchased" });
    }

    // Get course with lessons
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Get all lessons (including sub-lessons) for this course
    const { data: allLessons } = await supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    const trackableIds = getTrackableLessonIds(allLessons || []);
    const totalLessons = trackableIds.length;

    // Get user's progress for trackable lessons
    const { data: progress } = await supabaseAdmin
      .from("user_lesson_progress")
      .select("*")
      .eq("user_id", userData.user.id)
      .in("lesson_id", trackableIds.length > 0 ? trackableIds : ["__none__"]);

    const completedLessons = progress?.filter(p => p.completed).length || 0;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const flatWithProgress = (allLessons || []).map(lesson => {
      const lessonProgress = progress?.find(p => p.lesson_id === lesson.id);
      return {
        ...lesson,
        completed: lessonProgress?.completed || false,
        lastWatchedAt: lessonProgress?.last_watched_at || null,
      };
    });

    return res.status(200).json({
      course,
      progress: {
        totalLessons,
        completedLessons,
        remainingLessons: totalLessons - completedLessons,
        progressPercentage,
      },
      lessons: nestLessons(flatWithProgress),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

