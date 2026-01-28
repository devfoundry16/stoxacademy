'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAdmin } from '@/lib/hooks/useAdmin';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const t = useTranslations('admin.layout');
    const { loading, isAdmin } = useAdmin();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    // Don't render admin content if user is not an admin (redirect is in progress)
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('redirecting')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className={`min-h-screen justify-center items-center ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
