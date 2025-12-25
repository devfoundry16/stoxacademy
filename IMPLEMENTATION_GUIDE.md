# Courses Implementation Guide

## ✅ Completed

### 1. Database Setup

**Files Created:**
- `apps/api/migrations/create_courses_table.sql` - Database schema
- `apps/api/migrations/seed_courses.sql` - Seed data

**Tables Created:**
- `courses` - Store course information
- `lessons` - Store lesson information
- `user_courses` - Track user purchases
- `user_lesson_progress` - Track lesson progress

**To Apply:**
```bash
# Run in Supabase SQL Editor
1. Execute create_courses_table.sql
2. Execute seed_courses.sql
```

### 2. Backend API

**Files Created:**
- `apps/api/src/controllers/courseController.ts` - Course endpoints
- `apps/api/src/routes/courseRoutes.ts` - Course routes
- Updated `apps/api/src/index.ts` - Added course routes

**Endpoints:**
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses/purchase` - Purchase a course (protected)
- `GET /api/courses/user/courses` - Get user's purchased courses (protected)
- `POST /api/courses/lesson/progress` - Update lesson progress (protected)

### 3. Frontend Service

**Files Created:**
- `apps/web/src/lib/courseService.js` - API client for courses

### 4. Frontend Pages

**Files Updated:**
- `apps/web/src/app/courses/page.js` - Courses list (now uses API)
- `apps/web/src/app/courses/[id]/page.js` - Course detail (needs cleanup)
- `apps/web/src/components/header.js` - Added courses link

## 🔧 Next Steps

### 1. Clean Up Course Detail Page

The course detail page (`apps/web/src/app/courses/[id]/page.js`) has duplicate code and needs to be rewritten to use the API instead of mock data.

**Required Changes:**
```javascript
// Remove all mock data
// Add useEffect to fetch course
// Update to use course.lessons array from API
// Update to use course.features, requirements, what_you_learn from JSONB fields
```

### 2. Test the Implementation

```bash
# Start backend
cd apps/api
pnpm dev

# Start frontend
cd apps/web
pnpm dev

# Test:
1. Browse courses at http://localhost:3000/courses
2. Click on a course
3. Try to purchase (will need payment integration)
```

### 3. Add Payment Integration

Update `purchaseCourse` in `courseController.ts` to integrate with:
- Stripe
- PayPal
- Or other payment provider

### 4. Add Video Storage

Currently using placeholder videos. Need to:
1. Upload videos to cloud storage (AWS S3, Cloudflare R2, etc.)
2. Generate signed URLs for security
3. Update lesson records with video URLs

## 📝 Data Structure

### Course Object (from API)
```javascript
{
  id: "uuid",
  title: "string",
  description: "string",
  thumbnail: "url",
  duration: "string",
  lessons_count: number,
  level: "Beginner|Intermediate|Advanced",
  price: decimal,
  rating: decimal,
  students: number,
  instructor: "string",
  instructor_avatar: "url",
  features: ["array"],
  requirements: ["array"],
  what_you_learn: ["array"],
  isPurchased: boolean, // Added by API based on user
  lessons: [
    {
      id: "uuid",
      title: "string",
      duration: "string",
      video_url: "url",
      is_preview: boolean,
      order_index: number
    }
  ]
}
```

## 🔒 Access Control

### Courses List
- ✅ Everyone can view
- ✅ Shows lock icon for unpurchased courses

### Course Detail
- ✅ Everyone can view course info
- ✅ Preview lessons available to all
- ✅ Paid lessons require purchase

### Video Playback
- ✅ Preview lessons: Available to all
- ✅ Paid lessons: Requires authentication + purchase

## 🚀 Deployment Checklist

- [ ] Run database migrations in production Supabase
- [ ] Run seed data in production
- [ ] Update environment variables
- [ ] Test all endpoints
- [ ] Add error monitoring
- [ ] Add analytics
- [ ] Optimize images
- [ ] Add CDN for videos
- [ ] Set up backup strategy

## 📊 Analytics to Track

- Course views
- Purchase conversions
- Lesson completion rates
- User engagement
- Revenue per course

## 🔐 Security Considerations

- ✅ Row Level Security enabled
- ✅ Protected endpoints use authentication
- [ ] Video URLs should be signed/temporary
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all endpoints
- [ ] CORS properly configured

