"use client";

import { useTranslations } from 'next-intl';

export function Footer() {
    const t = useTranslations();
    return (
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">© {new Date().getFullYear()}. {t('common.allRightsReserved')} | {t('common.termsOfUse')}</p>
            <p className="text-gray-400">{t('common.designedBy')}</p>
          </div>
        </div>
      </footer>
    )
  }
  