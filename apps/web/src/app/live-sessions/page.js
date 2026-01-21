'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, DollarSign, Video, CheckCircle, Filter, TrendingUp, Play, ArrowRight } from 'lucide-react';
import { Header, LoadingSpinner, ErrorState } from '@/components';
import { liveSessionService } from '@/lib/liveSessionService';
import { authService } from '@/lib/auth';

function LiveSessionCard({ session, isAuthenticated }) {
    const router = useRouter();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'scheduled':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-800',
                    dot: 'bg-blue-500',
                    label: 'Scheduled'
                };
            case 'live':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    dot: 'bg-red-500 animate-pulse',
                    label: 'Live Now'
                };
            case 'completed':
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    dot: 'bg-gray-500',
                    label: 'Completed'
                };
            case 'cancelled':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    dot: 'bg-yellow-500',
                    label: 'Cancelled'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    dot: 'bg-gray-500',
                    label: 'Unknown'
                };
        }
    };

    const handleViewDetails = () => {
        router.push(`/live-sessions/${session.id}`);
    };

    const statusConfig = getStatusConfig(session.status);

    return (
        <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            {/* Gradient Header */}
            <div className="h-2 bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
            
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
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${statusConfig.bg} ${statusConfig.text}`}>
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                            {statusConfig.label}
                        </span>
                        {session.isEnrolled && (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                <CheckCircle size={14} />
                                Enrolled
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {session.description && (
                    <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">{session.description}</p>
                )}

                {/* Session details with enhanced styling */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">Date</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDate(session.scheduled_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Clock size={18} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">Time</p>
                            <p className="text-sm font-semibold text-gray-900">{formatTime(session.scheduled_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Users size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">Participants</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {session.participants_count || 0}
                                {session.max_participants ? ` / ${session.max_participants}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-linear-to-br from-green-50 to-emerald-50 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign size={18} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">Price</p>
                            <p className="text-sm font-bold text-green-700">${parseFloat(session.price || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Duration Badge */}
                <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <Clock size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{session.duration} minutes duration</span>
                </div>

                {/* Action button with enhanced styling */}
                <button
                    onClick={handleViewDetails}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-md hover:shadow-xl group"
                >
                    {session.status === 'live' ? <Play size={20} className="animate-pulse" /> : <Video size={20} />}
                    <span>{session.status === 'live' ? 'Join Live Session' : 'View Details'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

    const fetchLiveSessions = useCallback(async () => {
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
    }, [statusFilter]);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
        fetchLiveSessions();
    }, [fetchLiveSessions]);

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

    // Calculate stats
    const stats = {
        total: sessions.length,
        scheduled: sessions.filter(s => s.status === 'scheduled').length,
        live: sessions.filter(s => s.status === 'live').length,
        completed: sessions.filter(s => s.status === 'completed').length,
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
            <Header />
            
            {/* Enhanced Page Header */}
            <div className="pt-36 pb-20 bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                            <Video size={20} />
                            <span className="text-sm font-semibold">Interactive Learning</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                            Live Sessions
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                            Join interactive live sessions with expert instructors and learn in real-time
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <TrendingUp size={24} className="text-indigo-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Calendar size={24} className="text-blue-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{stats.scheduled}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Scheduled</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <Play size={24} className="text-red-600 animate-pulse" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{stats.live}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Live Now</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-gray-100 rounded-xl">
                                <CheckCircle size={24} className="text-gray-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{stats.completed}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                    </div>
                </div>
            </div>

            {/* Enhanced Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Filter size={20} className="text-blue-600" />
                            </div>
                            <label className="text-sm font-semibold text-gray-900">Filter by Status:</label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setStatusFilter('')}
                                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                    statusFilter === '' 
                                        ? 'bg-blue-600 text-white shadow-lg' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All Sessions
                            </button>
                            <button
                                onClick={() => setStatusFilter('scheduled')}
                                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                    statusFilter === 'scheduled' 
                                        ? 'bg-blue-600 text-white shadow-lg' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Scheduled
                            </button>
                            <button
                                onClick={() => setStatusFilter('live')}
                                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                    statusFilter === 'live' 
                                        ? 'bg-red-600 text-white shadow-lg animate-pulse' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Live Now
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                                    statusFilter === 'completed' 
                                        ? 'bg-gray-700 text-white shadow-lg' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sessions Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
                {sessions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                            <Video size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No live sessions found</h3>
                        <p className="text-gray-600 text-lg">Check back later for upcoming live sessions</p>
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
