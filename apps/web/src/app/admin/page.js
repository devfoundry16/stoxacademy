'use client';

import { useEffect, useState } from 'react';
import { Users, BookOpen, DollarSign, Video } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { getDashboardStats } from '@/lib/api/adminApi';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome to your admin dashboard</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="blue"
                    trend={stats?.newUsers ? ((stats.newUsers / stats.totalUsers) * 100).toFixed(1) : 0}
                />
                <StatCard
                    title="Total Courses"
                    value={stats?.totalCourses || 0}
                    icon={BookOpen}
                    color="purple"
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${stats?.totalRevenue?.toLocaleString() || 0}`}
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    title="Active Sessions"
                    value={stats?.activeSessions || 0}
                    icon={Video}
                    color="orange"
                />
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">New user registration</p>
                                <p className="text-xs text-gray-500">2 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Course purchased</p>
                                <p className="text-xs text-gray-500">15 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Live session scheduled</p>
                                <p className="text-xs text-gray-500">1 hour ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow">
                            <Users className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">Add User</p>
                        </button>
                        <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow">
                            <BookOpen className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">Create Course</p>
                        </button>
                        <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-shadow">
                            <Video className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">Schedule Session</p>
                        </button>
                        <button className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-shadow">
                            <DollarSign className="mx-auto mb-2" size={24} />
                            <p className="text-sm font-medium">View Reports</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Platform Overview</h2>
                <p className="text-blue-100 mb-4">
                    You have {stats?.totalEnrollments || 0} total enrollments across all courses
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-blue-100">New Users (7 days)</p>
                        <p className="text-2xl font-bold">{stats?.newUsers || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-100">Avg. Revenue/Course</p>
                        <p className="text-2xl font-bold">
                            ${stats?.totalCourses > 0 ? ((stats?.totalRevenue || 0) / stats.totalCourses).toFixed(0) : 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-100">Enrollments/Course</p>
                        <p className="text-2xl font-bold">
                            {stats?.totalCourses > 0 ? ((stats?.totalEnrollments || 0) / stats.totalCourses).toFixed(1) : 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-100">Active Sessions</p>
                        <p className="text-2xl font-bold">{stats?.activeSessions || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
