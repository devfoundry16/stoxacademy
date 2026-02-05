'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Calendar, Clock, Users, DollarSign, Video, ExternalLink, Lock, CheckCircle, ArrowLeft, PhoneOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header, LoadingSpinner, ErrorState } from '@/components';
import { liveSessionService } from '@/lib/liveSessionService';
import { authService } from '@/lib/auth';
import { paymentService } from '@/lib/paymentService';
import StripeCheckoutModal from '@/components/StripeCheckoutModal';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from '@/lib/animations';

export default function LiveSessionDetailPage({ params }) {
    const t = useTranslations('liveSessions.detail');
    const tStatus = useTranslations('liveSessions.status');
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountInfo, setDiscountInfo] = useState({
        originalPrice: 0,
        finalPrice: 0,
        discountPercentage: 0,
    });
    const [endingMeeting, setEndingMeeting] = useState(false);
    const { id } = React.use(params);

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
            setError(t('loadingSession'));
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            toast.error(t('signInToEnroll'));
            router.push('/login');
            return;
        }

        try {
            setEnrolling(true);
            // Create payment intent without coupon initially
            const response = await paymentService.createLiveSessionPaymentIntent(session.id);
            setClientSecret(response.clientSecret);
            setPaymentIntentId(response.paymentIntentId);
            setDiscountInfo({
                originalPrice: parseFloat(session.price || 0),
                finalPrice: parseFloat(session.price || 0),
                discountPercentage: 0,
            });
            setCheckoutModalOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.error || t('failedToInitializePayment'));
        } finally {
            setEnrolling(false);
        }
    };

    const handleApplyCoupon = async (couponCode) => {
        if (!couponCode) {
            // Remove coupon - recreate payment intent without coupon
            try {
                const response = await paymentService.createLiveSessionPaymentIntent(session.id);
                setClientSecret(response.clientSecret);
                setPaymentIntentId(response.paymentIntentId);
                setAppliedCoupon(null);
                setDiscountInfo({
                    originalPrice: parseFloat(session.price || 0),
                    finalPrice: parseFloat(session.price || 0),
                    discountPercentage: 0,
                });
                toast.success(t('couponRemoved'));
            } catch (error) {
                toast.error(t('failedToRemoveCoupon'));
            }
            return;
        }

        // Apply coupon - recreate payment intent with coupon
        try {
            const response = await paymentService.createLiveSessionPaymentIntent(
                session.id,
                couponCode
            );

            setClientSecret(response.clientSecret);
            setPaymentIntentId(response.paymentIntentId);
            setAppliedCoupon(couponCode);
            setDiscountInfo({
                originalPrice: parseFloat(response.originalPrice),
                finalPrice: parseFloat(response.finalPrice),
                discountPercentage: response.discountPercentage,
            });

            toast.success(`${t('couponApplied')} ${response.discountPercentage}% ${t('off')}`);
        } catch (error) {
            toast.error(error.response?.data?.error || t('invalidCoupon'));
            throw error;
        }
    };

    const handlePaymentSuccess = async (paymentIntent) => {
        try {
            setEnrolling(true);
            // Confirm payment on backend
            await paymentService.confirmLiveSessionPayment(paymentIntent.id);
            setCheckoutModalOpen(false);
            toast.success(t('successfullyEnrolled'));
            // Refresh session data
            await fetchSession();
        } catch (err) {
            toast.error(err.response?.data?.error || t('paymentConfirmationFailed'));
        } finally {
            setEnrolling(false);
        }
    };

    const handlePaymentError = (error) => {
        console.error('Payment error:', error);
        toast.error(error.message || t('paymentFailed'));
    };

    const handleJoinSession = () => {
        if (session.video_provider === 'daily' && session.video_room_name) {
            router.push(`/live-sessions/${session.id}/room`);
        } else if (session.meeting_url) {
            window.open(session.meeting_url, '_blank');
        } else {
            toast.error(t('meetingLinkNotAvailable'));
        }
    };

    const user = authService.getStoredUser();
    const isHost = session?.instructor_id && user?.id === session.instructor_id;

    const handleEndMeeting = async () => {
        if (!session?.id || !isHost) return;
        try {
            setEndingMeeting(true);
            await liveSessionService.endMeeting(session.id);
            toast.success(t('meetingEnded'));
            await fetchSession();
        } catch (err) {
            toast.error(err.response?.data?.error || t('failedToEndMeeting'));
        } finally {
            setEndingMeeting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZoneName: 'short',
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
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

    const getStatusLabel = (status) => {
        const statusTranslations = {
            'scheduled': tStatus('scheduled'),
            'live': tStatus('liveNow'),
            'completed': tStatus('completed'),
            'cancelled': tStatus('cancelled'),
        };
        return statusTranslations[status] || tStatus('unknown');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <LoadingSpinner message={t('loadingSession')} fullScreen />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <ErrorState
                    message={error || t('sessionNotFound')}
                    actionLabel={t('backToLiveSessions')}
                    onAction={() => router.push('/live-sessions')}
                    fullScreen
                />
            </div>
        );
    }

    const canJoin = session.isEnrolled && (session.status === 'live' || session.status === 'scheduled');
    const isFullyBooked = session.max_participants && session.participants_count >= session.max_participants;

    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="min-h-screen bg-gray-50"
        >
            <Header />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={defaultTransition}
                className="pt-36 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
            >
                {/* Back button */}
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ x: 0 }}
                    onClick={() => router.push('/live-sessions')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft size={20} />
                    {t('backToLiveSessions')}
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...defaultTransition, delay: 0.1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...defaultTransition, delay: 0.2 }}
                        className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-8"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h1 className="text-3xl font-bold flex-1">{session.title}</h1>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase ${getStatusColor(session.status)}`}>
                                {getStatusLabel(session.status)}
                            </span>
                        </div>
                        {session.courses && (
                            <p className="text-blue-100 text-lg">{t('course')}: {session.courses.title}</p>
                        )}
                    </motion.div>

                    {/* Main content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ ...defaultTransition, delay: 0.3 }}
                        className="p-8"
                    >
                        {/* Enrollment status */}
                        {session.isEnrolled && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...defaultTransition, delay: 0.4 }}
                                className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3"
                            >
                                <CheckCircle className="text-green-600" size={24} />
                                <div>
                                    <p className="font-semibold text-green-900">{t('youreEnrolled')}</p>
                                    {canJoin && (
                                        <p className="text-sm text-green-700">
                                            {session.status === 'live' ? t('sessionLiveNow') : t('canJoinWhenStarts')}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Session details grid */}
                        <motion.div
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                        >
                            <motion.div
                                variants={staggerItem}
                                whileHover={{ y: -2 }}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                            >
                                <Calendar size={24} className="text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">{t('date')}</p>
                                    <p className="font-semibold text-gray-900">{formatDate(session.scheduled_at)}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={staggerItem}
                                whileHover={{ y: -2 }}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                            >
                                <Clock size={24} className="text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">{t('timeAndDuration')}</p>
                                    <p className="font-semibold text-gray-900">{formatTime(session.scheduled_at)} • {session.duration} {t('minutes')}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={staggerItem}
                                whileHover={{ y: -2 }}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                            >
                                <Users size={24} className="text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">{t('participants')}</p>
                                    <p className="font-semibold text-gray-900">
                                        {session.participants_count || 0}
                                        {session.max_participants ? ` / ${session.max_participants}` : ''} {t('enrolled')}
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={staggerItem}
                                whileHover={{ y: -2 }}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                            >
                                <DollarSign size={24} className="text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">{t('price')}</p>
                                    <p className="font-semibold text-gray-900 text-2xl">${parseFloat(session.price || 0).toFixed(2)}</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Description */}
                        {session.description && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...defaultTransition, delay: 0.5 }}
                                className="mb-8"
                            >
                                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('aboutThisSession')}</h2>
                                <p className="text-gray-600 leading-relaxed">{session.description}</p>
                            </motion.div>
                        )}

                        {/* Course information */}
                        {session.courses && session.courses.description && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...defaultTransition, delay: 0.6 }}
                                className="mb-8"
                            >
                                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('courseOverview')}</h2>
                                <p className="text-gray-600 leading-relaxed">{session.courses.description}</p>
                                {session.courses.instructor && (
                                    <p className="mt-3 text-sm text-gray-600">
                                        {t('instructor')}: <span className="font-medium text-gray-900">{session.courses.instructor}</span>
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* Action buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...defaultTransition, delay: 0.7 }}
                            className="flex gap-4"
                        >
                            {session.isEnrolled ? (
                                canJoin && (session.video_provider === 'daily' && session.video_room_name || session.meeting_url) ? (
                                    <>
                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            whileTap={{ y: 0 }}
                                            onClick={handleJoinSession}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                                        >
                                            <ExternalLink size={24} />
                                            {t('joinLiveSession')}
                                        </motion.button>
                                        {isHost && session.status === 'live' && (
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ y: 0 }}
                                                onClick={handleEndMeeting}
                                                disabled={endingMeeting}
                                                className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold text-lg"
                                            >
                                                <PhoneOff size={24} />
                                                {endingMeeting ? t('endingMeeting') : t('endMeeting')}
                                            </motion.button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-500 rounded-lg font-semibold text-lg cursor-not-allowed">
                                        <Lock size={24} />
                                        {session.status === 'completed' ? t('sessionCompleted') : t('meetingLinkNotAvailable')}
                                    </div>
                                )
                            ) : (
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ y: 0 }}
                                    onClick={handleEnroll}
                                    disabled={enrolling || isFullyBooked || session.status === 'completed' || session.status === 'cancelled'}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                                >
                                    {enrolling ? (
                                        t('enrolling')
                                    ) : isFullyBooked ? (
                                        <>
                                            <Lock size={24} />
                                            {t('sessionFull')}
                                        </>
                                    ) : (
                                        <>
                                            <Video size={24} />
                                            {t('enrollNow', { price: parseFloat(session.price || 0).toFixed(2) })}
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </motion.div>

                        {!isAuthenticated && !session.isEnrolled && (
                            <p className="text-center text-sm text-gray-600 mt-4">
                                {t('signInToEnroll')} <button onClick={() => router.push('/login')} className="text-blue-600 hover:underline font-medium">{t('signIn')}</button>
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Stripe Checkout Modal */}
            {clientSecret && (
                <StripeCheckoutModal
                    isOpen={checkoutModalOpen}
                    onClose={() => setCheckoutModalOpen(false)}
                    clientSecret={clientSecret}
                    amount={discountInfo.finalPrice}
                    itemName={session.title}
                    originalPrice={discountInfo.originalPrice}
                    discountPercentage={discountInfo.discountPercentage}
                    appliedCoupon={appliedCoupon}
                    onApplyCoupon={handleApplyCoupon}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                />
            )}
        </motion.div>
    );
}
