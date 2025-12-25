# Database Seeding Guide

## Overview

This project uses a JSON-based seeding system for populating the database with initial course and lesson data.

## Quick Start

```bash
# Navigate to API directory
cd apps/api

# Seed the database
pnpm seed

# Reset the database (optional)
pnpm seed:reset
```

## Directory Structure

```
apps/api/
├── seeds/
│   ├── courses.json      # Course data
│   ├── lessons.json      # Lesson data
│   └── README.md         # Detailed seeding documentation
├── scripts/
│   ├── seed.js           # Seeding script
│   └── seed-reset.js     # Reset script
└── migrations/
    ├── create_users_table.sql
    ├── create_courses_table.sql
    └── seed_courses.sql  # (deprecated - use JSON seeding)
```

## Seed Data Files

### courses.json

Contains an array of course objects with the following structure:

```json
{
  "id": "c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a",
  "title": "Stock Market Fundamentals",
  "description": "Learn the basics of stock market trading...",
  "thumbnail": "https://...",
  "duration": "4h 30m",
  "lessons_count": 6,
  "level": "Beginner",
  "price": 49.99,
  "rating": 4.8,
  "students": 1234,
  "instructor": "John Smith",
  "instructor_avatar": "https://...",
  "features": ["Lifetime access", "Certificate"],
  "requirements": ["No prior experience"],
  "what_you_learn": ["Understand markets", "Read charts"],
  "is_published": true
}
```

**Current Courses:**
1. Stock Market Fundamentals (Beginner) - $49.99
2. Technical Analysis Mastery (Intermediate) - $79.99
3. Options Trading Strategies (Advanced) - $99.99
4. Cryptocurrency Investment (Intermediate) - $69.99
5. Risk Management & Portfolio Building (Beginner) - $39.99
6. Day Trading Bootcamp (Advanced) - $149.99

### lessons.json

Contains an array of lesson objects linked to courses:

```json
{
  "course_id": "c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a",
  "title": "Introduction to Stock Markets",
  "duration": "15:30",
  "video_url": "https://...",
  "is_preview": true,
  "order_index": 1
}
```

**Key Fields:**
- `course_id` - Links to parent course
- `is_preview` - If true, lesson can be watched without purchase
- `order_index` - Controls lesson ordering
- `video_url` - Can be null for placeholder lessons

## Seeding Scripts

### seed.js

Main seeding script that:
1. Connects to Supabase using Service Role Key
2. Clears existing courses and lessons
3. Inserts all courses from `courses.json`
4. Inserts all lessons from `lessons.json`
5. Provides colored console output for status

**Usage:**
```bash
pnpm seed
```

**Output:**
```
🌱 Starting database seeding...

📚 Seeding courses...
✅ Cleared existing courses
✅ Seeded 6 courses

📖 Seeding lessons...
✅ Cleared existing lessons
✅ Seeded 12 lessons

🎉 Database seeding completed successfully!
```

### seed-reset.js

Reset script that:
1. Deletes all lessons
2. Deletes all user lesson progress
3. Deletes all purchases
4. Deletes all courses

**Usage:**
```bash
pnpm seed:reset
```

**When to use:**
- Before reseeding with updated data
- Cleaning up test data
- Resetting to fresh state

## Adding New Seed Data

### Option 1: Without Manual IDs (Easiest ⭐)

**No need to generate UUIDs!** The system auto-generates them.

1. Open `apps/api/seeds/courses.json`
2. Add a new course object (without `id` field):

```json
{
  "title": "Your New Course",
  "description": "Description here",
  "thumbnail": "https://images.unsplash.com/...",
  "duration": "5h 00m",
  "lessons_count": 10,
  "level": "Intermediate",
  "price": 79.99,
  "rating": 4.5,
  "students": 0,
  "instructor": "Your Name",
  "instructor_avatar": "https://i.pravatar.cc/150?img=30",
  "features": ["Feature 1", "Feature 2"],
  "requirements": ["Requirement 1"],
  "what_you_learn": ["Skill 1", "Skill 2"],
  "is_published": true
}
```

3. Open `apps/api/seeds/lessons.json`
4. Add lesson objects using `course_title`:

```json
{
  "course_title": "Your New Course",
  "title": "Lesson 1: Introduction",
  "duration": "15:00",
  "video_url": "https://...",
  "is_preview": true,
  "order_index": 1
}
```

5. Run `pnpm seed` to apply changes

### Option 2: With Manual IDs

If you need consistent IDs across environments:

1. Generate a UUID:
   ```javascript
   // Node.js
   import { randomUUID } from 'crypto';
   console.log(randomUUID());
   ```

2. Add course with `id` field
3. Reference in lessons using `course_id`
4. Run `pnpm seed`

### Option 3: Use Template Generator

```bash
cd apps/api
pnpm generate:course
```

Follow the interactive prompts to create a course template.

## Environment Variables

Ensure these are set in `apps/api/.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

**Note:** Seeding uses the **Service Role Key** to bypass RLS policies.

## Workflow

### Development

```bash
# 1. Make changes to JSON files
vim apps/api/seeds/courses.json
vim apps/api/seeds/lessons.json

# 2. Seed the database
cd apps/api
pnpm seed

# 3. Verify in your app
# Navigate to http://localhost:3000/courses
```

### Production

```bash
# 1. Backup existing data
# (via Supabase Dashboard)

# 2. Run migrations first (if not already done)
# Via Supabase Dashboard SQL Editor

# 3. Seed production database
cd apps/api
pnpm seed
```

## Advantages of JSON Seeding

✅ **No Manual IDs Required** - Auto-generates UUIDs  
✅ **Version Control Friendly** - Easy to track changes in Git  
✅ **Programmatic** - Can be manipulated with scripts  
✅ **IDE Support** - Syntax highlighting and validation  
✅ **Portable** - Easy to share and duplicate  
✅ **Testable** - Can validate JSON schema  
✅ **Idempotent** - Clears old data before inserting new  
✅ **Use Course Titles** - Link lessons by title, not UUID

## Troubleshooting

### Error: Missing environment variables

**Solution:** Check that `.env` file exists and contains required variables:
```bash
cat apps/api/.env
```

### Error: Foreign key constraint

**Solution:** Ensure `course_id` in lessons matches an existing course ID in courses.json

### Error: Invalid UUID

**Solution:** Generate valid UUIDs using:
- Online: https://www.uuidgenerator.net/
- Node: `crypto.randomUUID()`
- Command line: `uuidgen`

### Seed script not found

**Solution:** Ensure you're in the correct directory:
```bash
cd /Users/dev/projects/Ali\ Fayad/stoxacademy/apps/api
pnpm seed
```

## Migration from SQL

The original `seed_courses.sql` file has been converted to JSON format:

- **Before:** SQL INSERT statements
- **After:** JSON arrays in `courses.json` and `lessons.json`

**Benefits:**
- Easier to edit and maintain
- Better version control
- Programmatic access
- IDE support

## Best Practices

1. **Always backup before seeding production**
2. **Test seeds in development first**
3. **Use meaningful UUIDs** (not sequential)
4. **Keep JSON formatted** (use Prettier)
5. **Document changes** in commit messages
6. **Validate JSON** before seeding
7. **Use preview lessons** to attract users

## Next Steps

1. ✅ Migrations applied
2. ✅ JSON seed files created
3. ✅ Seed scripts written
4. 🔄 Run `pnpm seed` to populate database
5. ✅ Test frontend at http://localhost:3000/courses

## Related Documentation

- [Migrations Guide](apps/api/migrations/README.md)
- [Seed Data README](apps/api/seeds/README.md)
- [API Controllers](apps/api/src/controllers/courseController.ts)
- [Frontend Services](apps/web/src/lib/courseService.js)

