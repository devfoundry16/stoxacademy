/**
 * Script to create an admin user
 * 
 * Usage: node scripts/create-admin.js
 * 
 * This script will prompt for user details and create an admin user in the database.
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
    try {
        // Check environment variables
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
            process.exit(1);
        }

        // Initialize Supabase client with service role
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        console.log('\n🔐 Create Admin User\n');

        // Get user details
        const email = await question('Email: ');
        const password = await question('Password: ');
        const firstName = await question('First Name: ');
        const lastName = await question('Last Name: ');

        console.log('\n⏳ Creating admin user...\n');

        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                role: 'admin',
            }
        });

        if (authError) {
            console.error('❌ Error creating auth user:', authError.message);
            process.exit(1);
        }

        console.log('✅ Auth user created:', authData.user.id);

        // Create user profile in database with admin role
        const { error: dbError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: email,
                first_name: firstName,
                last_name: lastName,
                phone_number: null,
                age: null,
                country: null,
                role: 'admin', // Set as admin
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (dbError) {
            console.error('❌ Error creating user profile:', dbError.message);
            // Try to delete the auth user if profile creation failed
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.log('🔄 Rolled back auth user creation');
            process.exit(1);
        }

        console.log('✅ User profile created with admin role');
        console.log('\n🎉 Admin user created successfully!\n');
        console.log('📧 Email:', email);
        console.log('👤 Name:', `${firstName} ${lastName}`);
        console.log('🔑 Role: admin');
        console.log('\nYou can now login with these credentials and access /admin\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run the script
createAdminUser();
