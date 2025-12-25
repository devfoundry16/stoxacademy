# Database Seeding

This directory contains seed data for the StoxAcademy database.

## Structure

- **courses.json** - Course data including title, description, pricing, and metadata
- **lessons.json** - Lesson data linked to courses via `course_id`

## Seed Scripts

### Seed Database

To populate the database with seed data:

```bash
cd apps/api
pnpm seed
```

This will:
1. Clear existing courses and lessons
2. Insert all courses from `courses.json`
3. Insert all lessons from `lessons.json`

### Reset Database

To clear all seed data:

```bash
cd apps/api
pnpm seed:reset
```

This will delete:
- All lessons
- All user lesson progress
- All user courses (purchases)
- All courses

## JSON Format

### courses.json

Each course object includes:

```json
{
  "id": "unique-uuid",
  "title": "Course Title",
  "description": "Course description",
  "thumbnail": "https://...",
  "duration": "4h 30m",
  "lessons_count": 6,
  "level": "Beginner|Intermediate|Advanced",
  "price": 49.99,
  "rating": 4.8,
  "students": 1234,
  "instructor": "Instructor Name",
  "instructor_avatar": "https://...",
  "features": ["feature1", "feature2"],
  "requirements": ["req1", "req2"],
  "what_you_learn": ["item1", "item2"],
  "is_published": true
}
```

### lessons.json

Each lesson object includes:

```json
{
  "course_id": "course-uuid",
  "title": "Lesson Title",
  "duration": "15:30",
  "video_url": "https://..." or null,
  "is_preview": true|false,
  "order_index": 1
}
```

## Adding New Data

### Option 1: Without Manual IDs (Recommended ⭐)

1. **Add a new course to `courses.json`:**
   - **No need to provide an `id` field** - it will be auto-generated!
   - Just add title, description, price, etc.

2. **Add lessons to `lessons.json`:**
   - Use `course_title` field instead of `course_id`
   - The system will automatically link lessons to courses by title

3. **Run the seed script:**
   ```bash
   pnpm seed
   ```

**Example:**
```json
// courses.json
{
  "title": "My New Course",
  "description": "...",
  "price": 49.99,
  ...
}

// lessons.json
{
  "course_title": "My New Course",
  "title": "Lesson 1",
  ...
}
```

### Option 2: With Manual IDs

1. **Add a new course:**
   - Add a course object to `courses.json`
   - Generate a unique UUID for the `id` field
   - Ensure all required fields are included

2. **Add lessons for a course:**
   - Add lesson objects to `lessons.json`
   - Reference the course using `course_id`
   - Set `order_index` to control lesson ordering

3. **Run the seed script:**
   ```bash
   pnpm seed
   ```

### Generate Template

Use the interactive course generator:
```bash
pnpm generate:course
```

## Notes

- The seed script uses the Supabase Service Role Key, so it bypasses RLS policies
- Existing data will be deleted before seeding
- **IDs are optional** - auto-generated if not provided
- **Use `course_title` in lessons** to avoid managing UUIDs manually
- If manual IDs provided, they must be valid UUID v4 format
- Cascade delete is enabled, so deleting a course will delete its lessons
- Preview lessons (`is_preview: true`) can be watched without purchasing

## Migration from SQL

The SQL seed files have been converted to JSON format for easier maintenance:

- `seed_courses.sql` → `courses.json` + `lessons.json`
- SQL seeding can still be done manually via Supabase Dashboard SQL Editor
- JSON seeding is recommended for version control and programmatic updates

