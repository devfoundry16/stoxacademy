# Fix: Purchased Courses Display Issue

## Problem
Purchased courses were still showing "Buy Now" button instead of "Enrolled" status on the courses list page.

## Root Cause
The `getAllCourses` API endpoint was not checking if the user has purchased courses. It only returned course data without the `isPurchased` field.

## Solution

### Backend Fix (`apps/api/src/controllers/courseController.ts`)

Updated `getAllCourses` function to:
1. Check for authorization token in request headers
2. If user is authenticated, fetch their purchased courses from `user_courses` table
3. Add `isPurchased: true/false` field to each course in the response

**Key Changes:**
```typescript
// Get user's purchased courses
let purchasedCourseIds: string[] = [];
if (token) {
  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  if (userData.user) {
    const { data: purchases } = await supabaseAdmin
      .from("user_courses")
      .select("course_id")
      .eq("user_id", userData.user.id);
    purchasedCourseIds = purchases.map((p) => p.course_id);
  }
}

// Add isPurchased field to each course
let sortedCourses = (courses || []).map((course) => ({
  ...course,
  isPurchased: purchasedCourseIds.includes(course.id),
}));
```

### Frontend (Already Working)
- `CourseCard` component checks `course.isPurchased`
- Shows "Enrolled" badge + "Continue Learning" button for purchased courses
- Shows price + "Buy Now" button for unpurchased courses
- API client automatically sends authorization token via interceptor

## Testing Steps

1. **Restart the backend server:**
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Clear browser cache/localStorage** (if needed)

3. **Test scenarios:**
   - ✅ Not logged in: All courses show "Sign In" button
   - ✅ Logged in (no purchases): All courses show price + "Buy Now"
   - ✅ Logged in (with purchases): Purchased courses show "✓ Enrolled" + "Continue Learning"

## Files Modified

1. `/apps/api/src/controllers/courseController.ts`
   - Updated `getAllCourses` function

2. `/apps/web/src/components/CourseCard.js`
   - Updated to show "Enrolled" badge for purchased courses
   - Changed button text to "Continue Learning"

## Database Requirements

Ensure the `user_courses` table exists with the following structure:
- `user_id` (UUID) - references auth.users
- `course_id` (UUID) - references courses
- Unique constraint on (user_id, course_id)

## API Response Format

**Before:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Course Title",
      "price": 49.99
      // No isPurchased field
    }
  ]
}
```

**After:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Course Title",
      "price": 49.99,
      "isPurchased": true  // Added for authenticated users
    }
  ]
}
```

## Notes

- The fix maintains backward compatibility for non-authenticated requests
- Authorization token is automatically included via axios interceptor
- The `isPurchased` field is computed at runtime based on user's purchases
- No database schema changes required

