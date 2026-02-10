import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported (Arabic first = default)
  locales: ['ar', 'en'],

  // Used when no locale matches (e.g. visiting /)
  defaultLocale: 'ar',
  localeDetection: false
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
