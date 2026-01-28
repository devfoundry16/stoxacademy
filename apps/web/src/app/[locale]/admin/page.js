'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Users, BookOpen, DollarSign, Video, FileText } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getDashboardStats, getRecentActivity } from '@/lib/api/adminApi';

export default function AdminDashboard() {
    const t = useTranslations('admin.dashboard');
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsData, activityData] = await Promise.all([
                getDashboardStats(),
                getRecentActivity(10)
            ]);
            setStats(statsData);
            setActivities(activityData.activities || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) {
            return t('justNow');
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return t('minutesAgo', { count: minutes });
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return t('hoursAgo', { count: hours });
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return t('daysAgo', { count: days });
        }
    };

    const getActivityColors = (type) => {
        switch (type) {
            case 'user_registration':
                return { bgColor: 'bg-blue-50', dotColor: 'bg-blue-500' };
            case 'course_purchase':
                return { bgColor: 'bg-green-50', dotColor: 'bg-green-500' };
            case 'live_session_scheduled':
                return { bgColor: 'bg-purple-50', dotColor: 'bg-purple-500' };
            default:
                return { bgColor: 'bg-gray-50', dotColor: 'bg-gray-500' };
        }
    };

    if (loading) {
        return (
            <LoadingSpinner fullScreen />
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
                <p className="text-gray-600">{t('welcome')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title={t('totalUsers')}
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="blue"
                    trend={stats?.newUsers ? ((stats.newUsers / stats.totalUsers) * 100).toFixed(1) : 0}
                />
                <StatCard
                    title={t('totalCourses')}
                    value={stats?.totalCourses || 0}
                    icon={BookOpen}
                    color="purple"
                />
                <StatCard
                    title={t('totalRevenue')}
                    value={`$${stats?.totalRevenue?.toLocaleString() || 0}`}
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    title={t('activeSessions')}
                    value={stats?.activeSessions || 0}
                    icon={Video}
                    color="orange"
                />
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{t('recentActivity')}</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : activities.length > 0 ? (
                            activities.map((activity) => {
                                const { bgColor, dotColor } = getActivityColors(activity.type);
                                return (
                                    <div key={activity.id} className={`flex items-start gap-4 p-4 ${bgColor} rounded-lg`}>
                                        <div className={`w-2 h-2 ${dotColor} rounded-full mt-1.5`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 wrap-break-word">{activity.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">{t('noRecentActivity')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{t('quickActions')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                        onClick={() => router.push('/admin/users')}>
                            <Users className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">{t('addUser')}</p>
                        </button>
                        <button className="p-4 bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                        onClick={() => router.push('/admin/courses')}>
                            <BookOpen className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">{t('createCourse')}</p>
                        </button>
                        <button className="p-4 bg-linear-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                        onClick={() => router.push('/admin/live-sessions')}>
                            <Video className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">{t('scheduleSession')}</p>
                        </button>
                        <button className="p-4 bg-linear-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                        onClick={() => router.push('/admin/checklist')}>
                            <FileText className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">{t('viewChecklist')}</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 bg-linear-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{t('platformOverview')}</h2>
                <p className="text-blue-100 mb-4">
                    {t('totalEnrollments', { count: stats?.totalEnrollments || 0 })}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-blue-100">{t('newUsers7Days')}</p>
                        <p className="text-2xl font-bold">{stats?.newUsers || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-100">{t('avgRevenuePerCourse')}</p>
                        <p className="text-2xl font-bold">
                            ${stats?.totalCourses > 0 ? ((stats?.totalRevenue || 0) / stats.totalCourses).toFixed(0) : 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-100">{t('enrollmentsPerCourse')}</p>
                        <p className="text-2xl font-bold">
                            {stats?.totalCourses > 0 ? ((stats?.totalEnrollments || 0) / stats.totalCourses).toFixed(1) : 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-100">{t('activeSessions')}</p>
                        <p className="text-2xl font-bold">{stats?.activeSessions || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
