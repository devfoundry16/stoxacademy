# Create Admin User Script

## Quick Start

To create an admin user, run:

```bash
cd apps/api
pnpm run create:admin
```

The script will prompt you for:
- Email
- Password
- First Name
- Last Name

It will then create a user with the **admin** role in your database.

## What It Does

1. Creates a user in Supabase Auth
2. Creates a user profile in the `users` table with `role = 'admin'`
3. If anything fails, it rolls back the changes

## Example

```bash
$ pnpm run create:admin

🔐 Create Admin User

Email: admin@example.com
Password: ********
First Name: Admin
Last Name: User

⏳ Creating admin user...

✅ Auth user created: abc-123-def-456
✅ User profile created with admin role

🎉 Admin user created successfully!

📧 Email: admin@example.com
👤 Name: Admin User
🔑 Role: admin

You can now login with these credentials and access /admin
```

## Requirements

- Database migrations must be run first (to have the `role` column)
- `.env` file must have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

**Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY**
- Make sure your `.env` file in `apps/api` has these variables set

**Error creating user profile**
- Make sure you've run the database migrations that add the `role` column
- Check that the `users` table exists in your Supabase database

**Email already exists**
- The email is already registered. Use a different email or delete the existing user first
