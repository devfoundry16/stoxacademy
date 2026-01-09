'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, DollarSign, Video, CheckCircle } from 'lucide-react';
import { Header, LoadingSpinner, ErrorState } from '@/components';
import { liveSessionService } from '@/lib/liveSessionService';
import { authService } from '@/lib/auth';

function LiveSessionCard({ session, isAuthenticated }) {
    const router = useRouter();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'live':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewDetails = () => {
        router.push(`/live-sessions/${session.id}`);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
                {/* Header with status badge */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                        {session.courses && (
                            <p className="text-sm text-blue-600 font-medium">
                                Course: {session.courses.title}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(session.status)}`}>
                            {session.status}
                        </span>
                        {session.isEnrolled && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <CheckCircle size={14} />
                                Enrolled
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {session.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{session.description}</p>
                )}

                {/* Session details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={18} className="text-blue-500" />
                        <span className="text-sm">{formatDate(session.scheduled_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} className="text-blue-500" />
                        <span className="text-sm">{formatTime(session.scheduled_at)} • {session.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Users size={18} className="text-blue-500" />
                        <span className="text-sm">
                            {session.participants_count || 0}
                            {session.max_participants ? ` / ${session.max_participants}` : ''} participants
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign size={18} className="text-green-500" />
                        <span className="text-sm font-semibold">${parseFloat(session.price || 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Action button */}
                <button
                    onClick={handleViewDetails}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <Video size={20} />
                    View Details
                </button>
            </div>
        </div>
    );
}

export default function LiveSessionsPage() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
        fetchLiveSessions();
    }, [statusFilter]);

    const fetchLiveSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters = {};
            if (statusFilter) {
                filters.status = statusFilter;
            }
            const data = await liveSessionService.getAllLiveSessions(filters);
            setSessions(data.sessions);
        } catch (err) {
            console.error('Failed to fetch live sessions:', err);
            setError('Failed to load live sessions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <LoadingSpinner message="Loading live sessions..." fullScreen />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <ErrorState message={error} fullScreen />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            {/* Page Header */}
            <div className="pt-36 pb-24 bg-linear-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-4xl font-bold mb-4">Live Sessions</h1>
                    <p className="text-xl text-blue-100">Join interactive live sessions with expert instructors</p>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Sessions</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live Now</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Sessions Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
                {sessions.length === 0 ? (
                    <div className="text-center py-12">
                        <Video size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No live sessions found</h3>
                        <p className="text-gray-600">Check back later for upcoming live sessions</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map((session) => (
                            <LiveSessionCard
                                key={session.id}
                                session={session}
                                isAuthenticated={isAuthenticated}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
