import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to read JSON file
function readJsonFile(filename) {
  const filePath = join(__dirname, '..', 'seeds', filename);
  const fileContent = readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

// Seed courses
async function seedCourses() {
  console.log('📚 Seeding courses...');
  
  const courses = readJsonFile('courses.json');
  
  // Delete existing courses (cascade will delete lessons)
  const { error: deleteError } = await supabase
    .from('courses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('❌ Error deleting existing courses:', deleteError.message);
  } else {
    console.log('✅ Cleared existing courses');
  }
  
  // Auto-generate IDs if not provided
  const coursesWithIds = courses.map(course => ({
    ...course,
    id: course.id || randomUUID()
  }));
  
  // Insert new courses
  const { data, error } = await supabase
    .from('courses')
    .insert(coursesWithIds)
    .select();
  
  if (error) {
    console.error('❌ Error seeding courses:', error.message);
    throw error;
  }
  
  console.log(`✅ Seeded ${coursesWithIds.length} courses`);
  
  // Return courses with their IDs for lesson seeding
  return data || coursesWithIds;
}

// Seed lessons
async function seedLessons(courses) {
  console.log('📖 Seeding lessons...');
  
  const lessons = readJsonFile('lessons.json');
  
  // Delete existing lessons
  const { error: deleteError } = await supabase
    .from('lessons')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('❌ Error deleting existing lessons:', deleteError.message);
  } else {
    console.log('✅ Cleared existing lessons');
  }
  
  // Create a mapping of course titles to IDs for easier reference
  const courseMap = new Map();
  courses.forEach(course => {
    courseMap.set(course.title, course.id);
    if (course.id) courseMap.set(course.id, course.id); // Also map id to id
  });
  
  // Process lessons: allow course_id OR course_title
  const lessonsWithIds = lessons.map(lesson => {
    let courseId = lesson.course_id;
    
    // If course_title is provided, look up the ID
    if (lesson.course_title && courseMap.has(lesson.course_title)) {
      courseId = courseMap.get(lesson.course_title);
    }
    
    if (!courseId) {
      throw new Error(`Cannot find course for lesson: ${lesson.title}`);
    }
    
    return {
      ...lesson,
      course_id: courseId
    };
  });
  
  // Insert new lessons
  const { data, error } = await supabase
    .from('lessons')
    .insert(lessonsWithIds);
  
  if (error) {
    console.error('❌ Error seeding lessons:', error.message);
    throw error;
  }
  
  console.log(`✅ Seeded ${lessonsWithIds.length} lessons`);
  return lessonsWithIds;
}

// Main seeding function
async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Seed in order (courses first, then lessons)
    const courses = await seedCourses();
    await seedLessons(courses);
    
    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seed();

