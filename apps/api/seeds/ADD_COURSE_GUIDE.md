# How to Add a New Course

You have **3 easy ways** to add new courses:

---

## Method 1: Without Manual IDs (Easiest) ⭐

Just add your course to `courses.json` **without an `id` field**. The system will auto-generate UUIDs.

### Step 1: Add Course (No ID needed!)

Edit `courses.json`:

```json
[
  {
    "title": "My New Course",
    "description": "Learn amazing things...",
    "thumbnail": "https://images.unsplash.com/photo-...",
    "duration": "6h 00m",
    "lessons_count": 12,
    "level": "Intermediate",
    "price": 79.99,
    "rating": 4.7,
    "students": 0,
    "instructor": "Jane Doe",
    "instructor_avatar": "https://i.pravatar.cc/150?img=15",
    "features": ["Lifetime access", "Certificate"],
    "requirements": ["Basic knowledge"],
    "what_you_learn": ["Skill 1", "Skill 2"],
    "is_published": true
  }
]
```

### Step 2: Add Lessons (Use `course_title` instead of `course_id`)

Edit `lessons.json`:

```json
[
  {
    "course_title": "My New Course",
    "title": "Lesson 1: Introduction",
    "duration": "15:00",
    "video_url": "https://...",
    "is_preview": true,
    "order_index": 1
  },
  {
    "course_title": "My New Course",
    "title": "Lesson 2: Getting Started",
    "duration": "20:00",
    "video_url": null,
    "is_preview": false,
    "order_index": 2
  }
]
```

### Step 3: Seed Database

```bash
pnpm seed
```

**That's it!** IDs are generated automatically. ✨

---

## Method 2: With Manual IDs

If you need consistent IDs across environments, provide them manually.

### Step 1: Generate a UUID

```javascript
// In Node.js console
import { randomUUID } from 'crypto';
console.log(randomUUID());
// Output: "c7e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7g"
```

Or use online generator: https://www.uuidgenerator.net/

### Step 2: Add Course with ID

```json
{
  "id": "c7e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7g",
  "title": "My New Course",
  ...
}
```

### Step 3: Add Lessons with course_id

```json
{
  "course_id": "c7e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7g",
  "title": "Lesson 1",
  ...
}
```

### Step 4: Seed Database

```bash
pnpm seed
```

---

## Method 3: Use Template Generator

Interactive CLI tool to generate course templates.

### Step 1: Run Generator

```bash
pnpm generate:course
```

### Step 2: Answer Questions

```
Course Title: My New Course
Description: Learn amazing things
Level (Beginner/Intermediate/Advanced): Intermediate
Price ($): 79.99
Number of lessons: 12
Instructor Name: Jane Doe

Include manual ID? (y/n, default: n): n
```

### Step 3: Copy Generated JSON

The script creates a file like `course-my-new-course.json`. Copy the content to `courses.json`.

### Step 4: Add Lessons and Seed

Add lessons to `lessons.json` and run:

```bash
pnpm seed
```

---

## Quick Reference

### Course Fields

| Field | Type | Required | Example |
|-------|------|----------|---------|
| id | UUID | No* | Auto-generated |
| title | string | Yes | "Stock Trading 101" |
| description | string | Yes | "Learn the basics..." |
| thumbnail | URL | Yes | "https://..." |
| duration | string | Yes | "5h 30m" |
| lessons_count | number | Yes | 10 |
| level | enum | Yes | "Beginner", "Intermediate", "Advanced" |
| price | number | Yes | 49.99 |
| rating | number | Yes | 4.5 (0-5) |
| students | number | Yes | 0 |
| instructor | string | Yes | "John Doe" |
| instructor_avatar | URL | Yes | "https://..." |
| features | array | Yes | ["Feature 1"] |
| requirements | array | Yes | ["Requirement 1"] |
| what_you_learn | array | Yes | ["Skill 1"] |
| is_published | boolean | Yes | true |

*Auto-generated if not provided

### Lesson Fields

| Field | Type | Required | Example |
|-------|------|----------|---------|
| course_id | UUID | No** | "c7e9e7a0..." |
| course_title | string | No** | "Stock Trading 101" |
| title | string | Yes | "Introduction" |
| duration | string | Yes | "15:30" |
| video_url | URL/null | Yes | "https://..." or null |
| is_preview | boolean | Yes | true |
| order_index | number | Yes | 1 |

**Provide either `course_id` OR `course_title`

---

## Tips

✅ **Use `course_title` for lessons** - It's easier than managing UUIDs  
✅ **Set first lesson as preview** - `is_preview: true` attracts users  
✅ **Use order_index** - Controls lesson ordering (1, 2, 3...)  
✅ **Start with 0 students** - Will increment as users purchase  
✅ **Use Unsplash for images** - High-quality free thumbnails  
✅ **Keep descriptions detailed** - Helps with SEO and conversions  

---

## Example: Complete Course Addition

**courses.json:**
```json
{
  "title": "Advanced Day Trading",
  "description": "Master day trading with advanced strategies",
  "thumbnail": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
  "duration": "8h 00m",
  "lessons_count": 15,
  "level": "Advanced",
  "price": 129.99,
  "rating": 4.9,
  "students": 0,
  "instructor": "Sarah Johnson",
  "instructor_avatar": "https://i.pravatar.cc/150?img=5",
  "features": ["Lifetime access", "Live sessions", "1-on-1 support"],
  "requirements": ["Trading experience", "Capital to trade"],
  "what_you_learn": ["Day trading strategies", "Risk management", "Technical analysis"],
  "is_published": true
}
```

**lessons.json:**
```json
[
  {
    "course_title": "Advanced Day Trading",
    "title": "Market Psychology",
    "duration": "25:00",
    "video_url": "https://sample-videos.com/video.mp4",
    "is_preview": true,
    "order_index": 1
  },
  {
    "course_title": "Advanced Day Trading",
    "title": "Chart Patterns Deep Dive",
    "duration": "35:00",
    "video_url": null,
    "is_preview": false,
    "order_index": 2
  }
]
```

**Run:**
```bash
pnpm seed
```

Done! 🎉

