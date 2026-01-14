'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, DollarSign, Video, ExternalLink, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Header, LoadingSpinner, ErrorState } from '@/components';
import { liveSessionService } from '@/lib/liveSessionService';
import { authService } from '@/lib/auth';
import { paymentService } from '@/lib/paymentService';
import StripeCheckoutModal from '@/components/StripeCheckoutModal';

export default function LiveSessionDetailPage({ params }) {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const { id} = React.use(params);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
        fetchSession();
    }, [id]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await liveSessionService.getLiveSessionById(id);
            setSession(data.session);
        } catch (err) {
            console.error('Failed to fetch session:', err);
            setError('Failed to load live session details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            alert('Please sign in to enroll in this live session');
            router.push('/login');
            return;
        }

        try {
            setEnrolling(true);
            // Create payment intent
            const { clientSecret, paymentIntentId } = await paymentService.createLiveSessionPaymentIntent(session.id);
            setClientSecret(clientSecret);
            setPaymentIntentId(paymentIntentId);
            setCheckoutModalOpen(true);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to initialize payment. Please try again.');
        } finally {
            setEnrolling(false);
        }
    };

    const handlePaymentSuccess = async (paymentIntent) => {
        try {
            setEnrolling(true);
            // Confirm payment on backend
            await paymentService.confirmLiveSessionPayment(paymentIntent.id);
            setCheckoutModalOpen(false);
            alert('Successfully enrolled in live session!');
            // Refresh session data
            await fetchSession();
        } catch (err) {
            alert(err.response?.data?.error || 'Payment confirmation failed. Please contact support.');
        } finally {
            setEnrolling(false);
        }
    };

    const handlePaymentError = (error) => {
        console.error('Payment error:', error);
        alert(error.message || 'Payment failed. Please try again.');
    };

    const handleJoinSession = () => {
        if (session.meeting_url) {
            window.open(session.meeting_url, '_blank');
        } else {
            alert('Meeting link not available yet. Please check back closer to the session time.');
        }
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <LoadingSpinner message="Loading session details..." fullScreen />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <ErrorState
                    message={error || 'Session not found'}
                    actionLabel="Back to Live Sessions"
                    onAction={() => router.push('/live-sessions')}
                    fullScreen
                />
            </div>
        );
    }

    const canJoin = session.isEnrolled && (session.status === 'live' || session.status === 'scheduled');
    const isFullyBooked = session.max_participants && session.participants_count >= session.max_participants;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="pt-36 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back button */}
                <button
                    onClick={() => router.push('/live-sessions')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft size={20} />
                    Back to Live Sessions
                </button>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-8">
                        <div className="flex items-start justify-between mb-4">
                            <h1 className="text-3xl font-bold flex-1">{session.title}</h1>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase ${getStatusColor(session.status)}`}>
                                {session.status}
                            </span>
                        </div>
                        {session.courses && (
                            <p className="text-blue-100 text-lg">Course: {session.courses.title}</p>
                        )}
                    </div>

                    {/* Main content */}
                    <div className="p-8">
                        {/* Enrollment status */}
                        {session.isEnrolled && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                                <CheckCircle className="text-green-600" size={24} />
                                <div>
                                    <p className="font-semibold text-green-900">You&apos;re enrolled in this session!</p>
                                    {canJoin && (
                                        <p className="text-sm text-green-700">
                                            {session.status === 'live' ? 'Session is live now! Click below to join.' : 'You can join when the session starts.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Session details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Calendar size={24} className="text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Date</p>
                                    <p className="font-semibold text-gray-900">{formatDate(session.scheduled_at)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Clock size={24} className="text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Time & Duration</p>
                                    <p className="font-semibold text-gray-900">{formatTime(session.scheduled_at)} • {session.duration} minutes</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Users size={24} className="text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Participants</p>
                                    <p className="font-semibold text-gray-900">
                                        {session.participants_count || 0}
                                        {session.max_participants ? ` / ${session.max_participants}` : ''} enrolled
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <DollarSign size={24} className="text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Price</p>
                                    <p className="font-semibold text-gray-900 text-2xl">${parseFloat(session.price || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {session.description && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">About this session</h2>
                                <p className="text-gray-600 leading-relaxed">{session.description}</p>
                            </div>
                        )}

                        {/* Course information */}
                        {session.courses && session.courses.description && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-3">Course Overview</h2>
                                <p className="text-gray-600 leading-relaxed">{session.courses.description}</p>
                                {session.courses.instructor && (
                                    <p className="mt-3 text-sm text-gray-600">
                                        Instructor: <span className="font-medium text-gray-900">{session.courses.instructor}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-4">
                            {session.isEnrolled ? (
                                canJoin && session.meeting_url ? (
                                    <button
                                        onClick={handleJoinSession}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                                    >
                                        <ExternalLink size={24} />
                                        Join Live Session
                                    </button>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-500 rounded-lg font-semibold text-lg cursor-not-allowed">
                                        <Lock size={24} />
                                        {session.status === 'completed' ? 'Session Completed' : 'Meeting Link Not Available'}
                                    </div>
                                )
                            ) : (
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling || isFullyBooked || session.status === 'completed' || session.status === 'cancelled'}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                                >
                                    {enrolling ? (
                                        'Enrolling...'
                                    ) : isFullyBooked ? (
                                        <>
                                            <Lock size={24} />
                                            Session Full
                                        </>
                                    ) : (
                                        <>
                                            <Video size={24} />
                                            Enroll Now - ${parseFloat(session.price || 0).toFixed(2)}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {!isAuthenticated && !session.isEnrolled && (
                            <p className="text-center text-sm text-gray-600 mt-4">
                                Please <button onClick={() => router.push('/login')} className="text-blue-600 hover:underline font-medium">sign in</button> to enroll in this live session
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stripe Checkout Modal */}
            {clientSecret && (
                <StripeCheckoutModal
                    isOpen={checkoutModalOpen}
                    onClose={() => setCheckoutModalOpen(false)}
                    clientSecret={clientSecret}
                    amount={parseFloat(session.price || 0)}
                    itemName={session.title}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                />
            )}
        </div>
    );
}
