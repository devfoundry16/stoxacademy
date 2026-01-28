"use client";

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export function LocaleAttributes() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    // Cairo font is applied via CSS in globals.css when dir="rtl"
  }, [locale]);

  return null;
}
