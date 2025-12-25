# Reusable Components

This directory contains reusable UI components used across the application.

## Components

### LoadingSpinner
A loading spinner with customizable size and message.

**Props:**
- `message` (string, optional): Message to display below spinner. Default: "Loading..."
- `size` (string, optional): Size of spinner ('sm', 'md', 'lg'). Default: 'md'
- `fullScreen` (boolean, optional): If true, centers in viewport excluding header. Default: false

**Usage:**
```jsx
import { LoadingSpinner } from '@/components';

// Regular loading
<LoadingSpinner message="Loading courses..." size="lg" />

// Full screen loading (centered in viewport)
<LoadingSpinner message="Loading courses..." fullScreen />
```

### ErrorState
An error state component with optional action button.

**Props:**
- `message` (string, optional): Error message to display. Default: "Something went wrong"
- `actionLabel` (string, optional): Button label. Default: "Retry"
- `onAction` (function, optional): Click handler for action button
- `fullScreen` (boolean, optional): If true, centers in viewport excluding header. Default: false

**Usage:**
```jsx
import { ErrorState } from '@/components';

// Regular error state
<ErrorState 
  message="Failed to load data" 
  actionLabel="Try Again"
  onAction={() => fetchData()}
/>

// Full screen error (centered in viewport)
<ErrorState 
  message="Failed to load data" 
  actionLabel="Try Again"
  onAction={() => fetchData()}
  fullScreen
/>
```

### EmptyState
An empty state component with icon and optional action.

**Props:**
- `icon` (LucideIcon, optional): Icon component to display
- `title` (string, optional): Title text. Default: "No data found"
- `description` (string, optional): Description text
- `actionLabel` (string, optional): Button label
- `onAction` (function, optional): Click handler for action button

**Usage:**
```jsx
import { EmptyState } from '@/components';
import { BookOpen } from 'lucide-react';

<EmptyState
  icon={BookOpen}
  title="No courses found"
  description="Try adjusting your filters"
  actionLabel="Clear Filters"
  onAction={() => clearFilters()}
/>
```

### LevelBadge
A badge to display course difficulty level with color coding.

**Props:**
- `level` (string): Course level ('Beginner', 'Intermediate', 'Advanced')
- `className` (string, optional): Additional CSS classes

**Usage:**
```jsx
import { LevelBadge } from '@/components';

<LevelBadge level="Beginner" />
```

### CourseStats
Display course statistics (duration, lessons, rating).

**Props:**
- `duration` (string, optional): Course duration
- `lessonsCount` (number, optional): Number of lessons
- `rating` (number, optional): Course rating
- `className` (string, optional): Additional CSS classes

**Usage:**
```jsx
import { CourseStats } from '@/components';

<CourseStats 
  duration="4h 30m" 
  lessonsCount={12} 
  rating={4.8} 
/>
```

### CourseCard
A card component to display course information.

**Props:**
- `course` (object): Course data object
- `isAuthenticated` (boolean): User authentication status
- `onClick` (function): Click handler

**Usage:**
```jsx
import { CourseCard } from '@/components';

<CourseCard
  course={courseData}
  isAuthenticated={isLoggedIn}
  onClick={() => handleCourseClick(courseData)}
/>
```

### PageLayout
A layout wrapper with Header component.

**Props:**
- `children` (ReactNode): Page content
- `className` (string, optional): Additional CSS classes

**Usage:**
```jsx
import { PageLayout } from '@/components';

<PageLayout>
  <YourPageContent />
</PageLayout>
```

## Design System

### Colors
- **Beginner Level**: Green (`bg-green-100 text-green-700`)
- **Intermediate Level**: Blue (`bg-blue-100 text-blue-700`)
- **Advanced Level**: Purple (`bg-purple-100 text-purple-700`)
- **Primary Action**: Blue 600 (`bg-blue-600`)
- **Success**: Green 600 (`bg-green-600`)
- **Error**: Red 600 (`bg-red-600`)

### Sizes
- **Spinner SM**: 8x8 (2rem)
- **Spinner MD**: 12x12 (3rem)
- **Spinner LG**: 16x16 (4rem)

### Icons
We use [Lucide React](https://lucide.dev/) for icons.

## Best Practices

1. **Import from index**: Always import from `@/components` for cleaner imports
2. **Prop validation**: Components have default props for optional values
3. **Responsive**: All components are mobile-responsive
4. **Accessibility**: Components follow accessibility best practices
5. **Reusability**: Keep components generic and configurable

## Adding New Components

When creating new reusable components:

1. Create the component file in `/components/`
2. Export it from `/components/index.js`
3. Document it in this README
4. Add PropTypes or TypeScript types
5. Include usage examples
6. Test on mobile and desktop

