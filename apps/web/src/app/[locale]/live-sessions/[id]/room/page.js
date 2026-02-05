'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Header, LoadingSpinner } from '@/components';
import { liveSessionService } from '@/lib/liveSessionService';
import toast from 'react-hot-toast';
import { ArrowLeft, PhoneOff } from 'lucide-react';
import Daily from '@daily-co/daily-js';

const HOST_JOINED_MESSAGE_TYPE = 'host-joined';

export default function LiveSessionRoomPage({ params }) {
    const t = useTranslations('liveSessions.detail');
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [waitingForHost, setWaitingForHost] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [endingMeeting, setEndingMeeting] = useState(false);
    const callRef = useRef(null);
    const containerRef = useRef(null);
    const hostUserIdRef = useRef(null);
    const handlersRef = useRef(null);
    const { id } = React.use(params);

    useEffect(() => {
        let cancelled = false;
        const container = containerRef.current;

        // Destroy any existing Daily frame first (handles Strict Mode double-mount and re-runs)
        if (callRef.current) {
            callRef.current.destroy();
            callRef.current = null;
        }

        async function joinMeeting() {
            try {
                setLoading(true);
                setError(null);
                setWaitingForHost(false);
                const data = await liveSessionService.getMeetingToken(id);
                const { token, roomUrl, hostUserId } = data;
                hostUserIdRef.current = hostUserId ?? null;
                if (cancelled || !container) return;
                const call = Daily.createFrame(container, {
                    showLeaveButton: true,
                    iframeStyle: {
                        width: '100%',
                        height: '100%',
                        minHeight: '80vh',
                        border: 'none',
                        borderRadius: '8px',
                    },
                });
                callRef.current = call;

                const isHostUser = (userId) => {
                    const hostId = hostUserIdRef.current;
                    if (!hostId) return false;
                    return String(userId) === String(hostId);
                };

                const isHostInParticipants = (participantsObj) => {
                    if (!participantsObj || !hostUserIdRef.current) return false;
                    const hostId = String(hostUserIdRef.current);
                    const entries = Object.entries(participantsObj);
                    for (const [, p] of entries) {
                        if (p?.user_id != null && String(p.user_id) === hostId) return true;
                    }
                    return false;
                };

                const handleJoinedMeeting = () => {
                    if (cancelled || !callRef.current) return;
                    const participants = callRef.current.participants();
                    const local = participants?.local;
                    const myUserId = local?.user_id ?? null;
                    const hostUserId = hostUserIdRef.current;
                    // I am the host → broadcast and never show waiting
                    if (hostUserId && isHostUser(myUserId)) {
                        setIsHost(true);
                        setWaitingForHost(false);
                        callRef.current.sendAppMessage(
                            { type: HOST_JOINED_MESSAGE_TYPE, userId: hostUserId },
                            '*'
                        );
                        return;
                    }
                    // I am a participant: show waiting only if host is not already in the call
                    if (hostUserId) {
                        if (isHostInParticipants(participants)) {
                            setWaitingForHost(false);
                        } else {
                            setWaitingForHost(true);
                        }
                    }
                };

                const handleParticipantJoined = (event) => {
                    if (cancelled) return;
                    const { participant } = event;
                    if (participant?.user_id != null && isHostUser(participant.user_id)) {
                        setWaitingForHost(false);
                    }
                };

                const handleAppMessage = (event) => {
                    if (cancelled) return;
                    const { data } = event;
                    if (data?.type === HOST_JOINED_MESSAGE_TYPE) {
                        setWaitingForHost(false);
                    }
                };

                handlersRef.current = { handleJoinedMeeting, handleParticipantJoined, handleAppMessage };
                call.on('joined-meeting', handleJoinedMeeting);
                call.on('participant-joined', handleParticipantJoined);
                call.on('app-message', handleAppMessage);

                // Hide our spinner so the Daily iframe is visible (it shows its own joining/prejoin UI)
                if (!cancelled) setLoading(false);
                // Start join; don't await so we don't block on camera/permission or slow networks
                call.join({ url: roomUrl, token }).catch((err) => {
                    if (!cancelled) {
                        console.error('Failed to join meeting:', err);
                        const msg = err?.message || t('failedToLoadMeeting');
                        setError(msg);
                        toast.error(msg);
                    }
                });
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to join meeting:', err);
                    const msg = err.response?.data?.error || err.message || t('failedToLoadMeeting');
                    setError(msg);
                    toast.error(msg);
                    setLoading(false);
                }
            }
        }
        joinMeeting();

        return () => {
            cancelled = true;
            const call = callRef.current;
            callRef.current = null;
            const handlers = handlersRef.current;
            try {
                if (call && handlers) {
                    call.off('joined-meeting', handlers.handleJoinedMeeting);
                    call.off('participant-joined', handlers.handleParticipantJoined);
                    call.off('app-message', handlers.handleAppMessage);
                }
                if (call) {
                    call.destroy();
                }
            } catch (err) {
                // Daily may throw if iframe is already gone (e.g. after navigation)
                console.warn('Daily cleanup:', err?.message ?? err);
            }
        };
    }, [id, t]);

    const handleBack = () => {
        const call = callRef.current;
        if (!call) {
            router.push(`/live-sessions/${id}`);
            return;
        }
        callRef.current = null;
        const handlers = handlersRef.current;
        try {
            if (handlers) {
                call.off('joined-meeting', handlers.handleJoinedMeeting);
                call.off('participant-joined', handlers.handleParticipantJoined);
                call.off('app-message', handlers.handleAppMessage);
            }
            call.leave();
            call.destroy();
        } catch (err) {
            console.warn('Daily teardown on back:', err?.message ?? err);
        }
        router.push(`/live-sessions/${id}`);
    };

    const handleEndMeeting = async () => {
        try {
            setEndingMeeting(true);
            await liveSessionService.endMeeting(id);
            toast.success(t('meetingEnded'));
            const call = callRef.current;
            if (call) {
                callRef.current = null;
                const handlers = handlersRef.current;
                try {
                    if (handlers) {
                        call.off('joined-meeting', handlers.handleJoinedMeeting);
                        call.off('participant-joined', handlers.handleParticipantJoined);
                        call.off('app-message', handlers.handleAppMessage);
                    }
                    call.leave();
                    call.destroy();
                } catch (err) {
                    console.warn('Daily teardown:', err?.message ?? err);
                }
            }
            router.push(`/live-sessions/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || t('failedToEndMeeting'));
            setEndingMeeting(false);
        }
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft size={20} />
                            {t('backToLiveSessions')}
                        </button>
                        {isHost && !loading && !error && (
                            <button
                                onClick={handleEndMeeting}
                                disabled={endingMeeting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                <PhoneOff size={20} />
                                {endingMeeting ? t('endingMeeting') : t('endMeeting')}
                            </button>
                        )}
                    </div>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-24">
                            <LoadingSpinner />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => router.push(`/live-sessions/${id}`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {t('backToSession')}
                            </button>
                        </div>
                    )}

                    <div
                        className="relative w-full rounded-lg overflow-hidden"
                        style={{ display: loading || error ? 'none' : 'block', minHeight: '70vh' }}
                    >
                        <div
                            ref={containerRef}
                            className="w-full bg-gray-900 rounded-lg"
                            style={{ minHeight: '70vh' }}
                        />
                        {waitingForHost && (
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 rounded-lg"
                                aria-live="polite"
                            >
                                <div className="animate-pulse rounded-full w-16 h-16 bg-blue-500/30 mb-4" />
                                <p className="text-white text-lg font-medium">
                                    {t('waitingForHost')}
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {t('waitingForHostSubtext')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
