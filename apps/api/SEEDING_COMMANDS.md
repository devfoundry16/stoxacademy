# Seeding Commands Quick Reference

## Prerequisites

Ensure `.env` file exists with:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Commands

### Seed Database
```bash
cd apps/api
pnpm seed
```

Populates the database with courses and lessons from JSON files.

### Reset Database
```bash
cd apps/api
pnpm seed:reset
```

Clears all courses, lessons, and related data.

### Re-seed Database
```bash
cd apps/api
pnpm seed:reset && pnpm seed
```

Clears and re-populates the database.

### Generate Course Template
```bash
cd apps/api
pnpm generate:course
```

Interactive CLI to create a new course template.

## Add a New Course (No IDs Required! ⭐)

### Step 1: Edit `seeds/courses.json`

**Just add your course without an `id` field:**

```json
{
  "title": "My New Course",
  "description": "Learn amazing things...",
  "thumbnail": "https://images.unsplash.com/...",
  "duration": "5h 00m",
  "lessons_count": 10,
  "level": "Intermediate",
  "price": 79.99,
  "rating": 4.5,
  "students": 0,
  "instructor": "Your Name",
  "instructor_avatar": "https://i.pravatar.cc/150?img=15",
  "features": ["Lifetime access", "Certificate"],
  "requirements": ["Basic knowledge"],
  "what_you_learn": ["Skill 1", "Skill 2"],
  "is_published": true
}
```

### Step 2: Edit `seeds/lessons.json`

**Use `course_title` to link lessons:**

```json
{
  "course_title": "My New Course",
  "title": "Lesson 1: Introduction",
  "duration": "15:00",
  "video_url": "https://...",
  "is_preview": true,
  "order_index": 1
}
```

### Step 3: Seed

```bash
pnpm seed
```

**That's it!** IDs are auto-generated. ✨

## With Manual IDs (Optional)

If you need consistent IDs:

### courses.json
```json
{
  "id": "your-manual-uuid-here",
  "title": "My Course",
  ...
}
```

### lessons.json
```json
{
  "course_id": "your-manual-uuid-here",
  "title": "Lesson 1",
  ...
}
```

## Files to Edit

- **Add/Edit Courses:** `apps/api/seeds/courses.json`
- **Add/Edit Lessons:** `apps/api/seeds/lessons.json`
- **See Examples:** `apps/api/seeds/*.example.json`
- **Detailed Guide:** `apps/api/seeds/ADD_COURSE_GUIDE.md`

## After Editing

1. Save your JSON files
2. Run `pnpm seed`
3. Check your app at http://localhost:3000/courses

## Validation

Before seeding, validate JSON:
```bash
# Check if JSON is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('seeds/courses.json')))"
node -e "console.log(JSON.parse(require('fs').readFileSync('seeds/lessons.json')))"
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Missing env variables | Check `.env` file exists and is loaded |
| Foreign key error | Ensure `course_title` matches course title exactly |
| Invalid UUID | Only if using manual IDs - use valid UUID v4 |
| Permission denied | Check Service Role Key is correct |
| Course not found | Check spelling of `course_title` in lessons.json |

## Tips

✅ **No IDs needed** - System auto-generates them  
✅ **Use `course_title`** - Easier than managing UUIDs  
✅ **Set first lesson as preview** - Attracts users  
✅ **Use Unsplash** - Free high-quality thumbnails  
✅ **Validate JSON** - Before seeding to catch syntax errors  

## Next Steps

After seeding:
1. ✅ Start API: `cd apps/api && pnpm dev`
2. ✅ Start Web: `cd apps/web && pnpm dev`
3. ✅ Visit: http://localhost:3000/courses

---

For detailed documentation, see:
- [ADD_COURSE_GUIDE.md](seeds/ADD_COURSE_GUIDE.md) - Step-by-step guide
- [SEEDING_GUIDE.md](../../SEEDING_GUIDE.md) - Complete reference
- [seeds/README.md](seeds/README.md) - Seed data docs
