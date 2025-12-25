import { writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function generateCourse() {
  console.log('\n🎓 Course Template Generator\n');
  console.log('This will help you create a new course JSON entry.\n');

  const title = await question('Course Title: ');
  const description = await question('Description: ');
  const level = await question('Level (Beginner/Intermediate/Advanced): ') || 'Beginner';
  const price = await question('Price ($): ') || '49.99';
  const lessonsCount = await question('Number of lessons: ') || '10';
  const instructor = await question('Instructor Name: ') || 'Instructor';
  
  const includeId = await question('\nInclude manual ID? (y/n, default: n): ');
  
  const course = {
    ...(includeId.toLowerCase() === 'y' ? { id: randomUUID() } : {}),
    title,
    description,
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop",
    duration: "5h 00m",
    lessons_count: parseInt(lessonsCount) || 10,
    level,
    price: parseFloat(price) || 49.99,
    rating: 4.5,
    students: 0,
    instructor,
    instructor_avatar: "https://i.pravatar.cc/150?img=12",
    features: [
      "Lifetime access",
      "Certificate of completion",
      "Downloadable resources",
      "Mobile and desktop access",
      "Community support"
    ],
    requirements: [
      "No prior experience required",
      "Computer or mobile device"
    ],
    what_you_learn: [
      "Key concept 1",
      "Key concept 2",
      "Key concept 3"
    ],
    is_published: true
  };

  const filename = `course-${title.toLowerCase().replace(/\s+/g, '-')}.json`;
  writeFileSync(filename, JSON.stringify([course], null, 2));
  
  console.log(`\n✅ Course template saved to: ${filename}`);
  console.log('\nNext steps:');
  console.log('1. Edit the generated file to add more details');
  console.log('2. Add the course object to seeds/courses.json');
  console.log('3. Create lessons in seeds/lessons.json using "course_title" field');
  console.log('4. Run: pnpm seed\n');
  
  rl.close();
}

generateCourse().catch(console.error);

