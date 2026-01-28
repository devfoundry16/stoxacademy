# i18n Setup Documentation

## Overview
This project now supports internationalization (i18n) with Arabic translation and RTL (Right-to-Left) layout support using `next-intl`.

## Installation

First, install the required package:
```bash
cd apps/web
pnpm add next-intl
```

## Features Implemented

### 1. ✅ Locale Routing
- URLs are prefixed with locale (e.g., `/en/`, `/ar/`)
- Default locale: English (`en`)
- Supported locales: English (`en`), Arabic (`ar`)

### 2. ✅ RTL Support
- Arabic locale automatically applies RTL direction
- Layout adjusts for RTL text flow
- CSS utilities added for RTL spacing adjustments

### 3. ✅ Cairo Font
- Cairo font loaded from Google Fonts for Arabic text
- Automatically applied when locale is Arabic
- Supports multiple font weights (400-900)

### 4. ✅ Translation Files
- English translations: `src/messages/en.json`
- Arabic translations: `src/messages/ar.json`
- All frontend text content is translatable

### 5. ✅ Language Switcher
- Component: `src/components/LanguageSwitcher.js`
- Integrated into header navigation
- Available in both desktop and mobile menus

## File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── [locale]/          # Locale-based routes
│   │   │   ├── layout.js      # Locale layout with RTL support
│   │   │   ├── page.js        # Home page
│   │   │   ├── login/
│   │   │   │   └── page.js
│   │   │   └── courses/
│   │   │       └── page.js
│   │   └── layout.js          # Root layout (redirects to default locale)
│   ├── components/
│   │   └── LanguageSwitcher.js
│   ├── i18n/
│   │   ├── request.js         # i18n request configuration
│   │   └── routing.js          # Routing configuration
│   ├── messages/
│   │   ├── en.json            # English translations
│   │   └── ar.json            # Arabic translations
│   └── middleware.js          # Locale middleware
├── next.config.mjs            # Updated with next-intl plugin
└── package.json               # Add next-intl dependency
```

## Components Updated

All components have been updated to use translations:

1. ✅ `header.js` - Navigation and user menu
2. ✅ `hero-section.js` - Hero banner
3. ✅ `footer.js` - Footer content
4. ✅ `why-us-section.js` - Features section
5. ✅ `skills-section.js` - Skills section
6. ✅ `why-choose-us-section.js` - Reasons section
7. ✅ `testimonials-section.js` - Testimonials
8. ✅ `final-cta-section.js` - Call-to-action
9. ✅ `team-section.js` - Team members
10. ✅ `courses-section.js` - Course listings
11. ✅ `login/page.js` - Login page
12. ✅ `courses/page.js` - Courses page

## Usage

### Using Translations in Components

```javascript
"use client";

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('common.welcomeBack')}</h1>
      <p>{t('hero.description')}</p>
    </div>
  );
}
```

### Using Locale-Aware Navigation

```javascript
"use client";

import { Link, useRouter } from '@/i18n/routing';

export function Navigation() {
  const router = useRouter();
  
  return (
    <Link href="/courses">Courses</Link>
    // or
    <button onClick={() => router.push('/courses')}>
      Go to Courses
    </button>
  );
}
```

### Accessing Current Locale

```javascript
"use client";

import { useLocale } from 'next-intl';

export function MyComponent() {
  const locale = useLocale(); // 'en' or 'ar'
  
  return <div>Current locale: {locale}</div>;
}
```

## RTL Styling

The layout automatically applies RTL when locale is Arabic:

- `dir="rtl"` is set on `<html>` tag
- Cairo font is applied for Arabic
- CSS utilities handle RTL spacing

For custom RTL adjustments, use:

```css
[dir="rtl"] .my-class {
  /* RTL-specific styles */
}
```

## Next Steps

### Remaining Pages to Migrate

The following pages need to be moved to `[locale]` folder and updated with translations:

1. `signup/page.js` → `[locale]/signup/page.js`
2. `profile/page.js` → `[locale]/profile/page.js`
3. `my-courses/page.js` → `[locale]/my-courses/page.js`
4. `live-sessions/page.js` → `[locale]/live-sessions/page.js`
5. `courses/[id]/page.js` → `[locale]/courses/[id]/page.js`
6. `live-sessions/[id]/page.js` → `[locale]/live-sessions/[id]/page.js`
7. Admin pages (if needed)

### Additional Components to Update

1. `ChecklistFlow.js`
2. `CourseCard.js`
3. `EmptyState.js`
4. `ErrorState.js`
5. `LoadingSpinner.js`
6. Any other components with hardcoded text

### Testing Checklist

- [ ] Test language switching
- [ ] Verify RTL layout for Arabic
- [ ] Check Cairo font rendering
- [ ] Test all translated pages
- [ ] Verify navigation maintains locale
- [ ] Test form submissions with locale
- [ ] Check mobile menu with language switcher

## Configuration

### Adding New Locales

1. Add locale to `src/i18n/routing.js`:
```javascript
locales: ['en', 'ar', 'fr'], // Add 'fr' for French
```

2. Create translation file: `src/messages/fr.json`

3. Update `generateStaticParams` in `[locale]/layout.js` if using static generation

### Adding New Translations

1. Add key-value pairs to `src/messages/en.json`
2. Add corresponding translations to `src/messages/ar.json`
3. Use in components with `t('your.key.path')`

## Notes

- The root `/` URL redirects to `/en/` (default locale)
- All routes must be under `[locale]` folder
- Use `@/i18n/routing` for navigation instead of `next/navigation`
- Toast notifications position adjusts based on locale (left for RTL, right for LTR)
