'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/hooks/useAdmin';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
    const { loading, isAdmin } = useAdmin();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [loading, isAdmin]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
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
                    <p className="mt-4 text-gray-600">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="lg:ml-64 min-h-screen justify-center items-center">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
