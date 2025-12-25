# Database Migrations

This directory contains SQL migration files for the StoxAcademy database.

## Migration Files

### 1. create_users_table.sql

Creates the `users` table for storing user profiles:

- **Fields**: id, email, first_name, last_name, phone_number, age, country
- **RLS Policies**: Users can only read/update their own data
- **Relationship**: Linked to Supabase Auth via `auth.users.id`

### 2. create_courses_table.sql

Creates the courses, lessons, and purchases tables:

#### courses
- Stores course information (title, description, price, instructor, etc.)
- Contains JSON fields for features, requirements, and learning outcomes
- Has soft delete support via `is_published` flag

#### lessons
- Stores individual lessons within courses
- Linked to courses via `course_id` foreign key
- Includes video URLs and preview status

#### purchases (user_courses)
- Junction table for tracking course purchases
- Links users to purchased courses
- Includes purchase date and completion tracking

### 3. seed_courses.sql

Seeds initial course and lesson data (now deprecated in favor of JSON seeding).

## Running Migrations

### Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of each migration file
5. Run the query
6. Repeat for all migration files in order

### Via Supabase CLI

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Migration Order

**Important:** Run migrations in this order:

1. `create_users_table.sql` - Creates users table
2. `create_courses_table.sql` - Creates courses, lessons, and purchases tables
3. Use JSON seeding instead: `pnpm seed` (in apps/api directory)

## Rolling Back

To roll back a migration:

1. Drop the affected tables via SQL Editor:
   ```sql
   DROP TABLE IF EXISTS user_courses CASCADE;
   DROP TABLE IF EXISTS lessons CASCADE;
   DROP TABLE IF EXISTS courses CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

2. Re-run the migration files

## RLS (Row Level Security)

All tables have RLS enabled. Key policies:

- **users**: Users can only access their own profile
- **courses**: Public read access, admin-only write
- **lessons**: Public read access for published courses
- **purchases**: Users can only see their own purchases

## Notes

- Always backup your database before running migrations
- Test migrations in a development environment first
- Use transactions when modifying existing data
- Keep migration files in version control
- Document any manual steps required

