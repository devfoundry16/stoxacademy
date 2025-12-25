import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Reset database by deleting all seed data
async function resetDatabase() {
  try {
    console.log('🗑️  Resetting database...\n');
    
    // Delete all lessons first (due to foreign key constraints)
    console.log('Deleting lessons...');
    const { error: lessonsError } = await supabase
      .from('lessons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (lessonsError) {
      console.error('❌ Error deleting lessons:', lessonsError.message);
    } else {
      console.log('✅ Deleted all lessons');
    }
    
    // Delete all user lesson progress
    console.log('Deleting user lesson progress...');
    const { error: progressError } = await supabase
      .from('user_lesson_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (progressError) {
      console.error('❌ Error deleting progress:', progressError.message);
    } else {
      console.log('✅ Deleted all user progress');
    }
    
    // Delete all user courses (purchases)
    console.log('Deleting user courses...');
    const { error: userCoursesError } = await supabase
      .from('user_courses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (userCoursesError) {
      console.error('❌ Error deleting user courses:', userCoursesError.message);
    } else {
      console.log('✅ Deleted all user courses');
    }
    
    // Delete all courses
    console.log('Deleting courses...');
    const { error: coursesError } = await supabase
      .from('courses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (coursesError) {
      console.error('❌ Error deleting courses:', coursesError.message);
    } else {
      console.log('✅ Deleted all courses');
    }
    
    console.log('\n🎉 Database reset completed!');
    console.log('💡 Run "pnpm seed" to reseed the database');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Reset failed:', error);
    process.exit(1);
  }
}

// Run reset
resetDatabase();

