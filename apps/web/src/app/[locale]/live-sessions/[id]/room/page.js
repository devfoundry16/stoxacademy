'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Header, LoadingSpinner } from '@/components';
import { liveSessionService } from '@/lib/liveSessionService';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Daily from '@daily-co/daily-js';

export default function LiveSessionRoomPage({ params }) {
    const t = useTranslations('liveSessions.detail');
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const callRef = useRef(null);
    const containerRef = useRef(null);
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
                const { token, roomUrl } = await liveSessionService.getMeetingToken(id);
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
                if (cancelled) {
                    call.destroy();
                    callRef.current = null;
                }
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
            if (callRef.current) {
                callRef.current.destroy();
                callRef.current = null;
            }
        };
    }, [id, t]);

    const handleBack = () => {
        if (callRef.current) {
            callRef.current.leave();
        }
        router.push(`/live-sessions/${id}`);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft size={20} />
                        {t('backToLiveSessions')}
                    </button>

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
                        ref={containerRef}
                        className="w-full bg-gray-900 rounded-lg overflow-hidden"
                        style={{ display: loading || error ? 'none' : 'block', minHeight: '70vh' }}
                    />
                </div>
            </main>
        </>
    );
}
