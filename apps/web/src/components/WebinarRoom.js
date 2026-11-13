'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Daily from '@daily-co/daily-js';
import toast from 'react-hot-toast';
import { Hand, Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX, Send, Users, Check, X } from 'lucide-react';

// App-message types exchanged over the Daily call
const MSG = {
    chat: 'webinar-chat',
    request: 'webinar-speak-request',
    cancel: 'webinar-speak-cancel',
    deny: 'webinar-speak-deny',
};

const canSendAudio = (p) => {
    const cs = p?.permissions?.canSend;
    return cs === true || (cs instanceof Set && cs.has('audio'));
};
const playable = (p, kind) => p?.tracks?.[kind]?.state === 'playable' && p.tracks[kind].persistentTrack;

function Track({ track, audio, className }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.srcObject = track ? new MediaStream([track]) : null;
    }, [track]);
    return audio ? <audio ref={ref} autoPlay /> : <video ref={ref} autoPlay playsInline muted className={className} />;
}

function Tile({ p, label, big }) {
    const video = playable(p, 'video');
    return (
        <div className={`relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center ${big ? 'w-full h-full' : 'aspect-video'}`}>
            {video ? (
                <Track track={video} className="w-full h-full object-cover" />
            ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500/60 flex items-center justify-center text-white text-2xl font-semibold">
                    {(p.user_name || '?').charAt(0).toUpperCase()}
                </div>
            )}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                {label}
            </span>
        </div>
    );
}

/**
 * Webinar room: hosts (meeting owners) broadcast camera/mic/screen; guests join hidden and listen-only,
 * chat, and can request to speak. Hosts promote a guest by granting presence + audio send permission.
 */
export default function WebinarRoom({ token, roomUrl, isHost, onLeave, onError }) {
    const t = useTranslations('liveSessions.webinar');
    const tDetail = useTranslations('liveSessions.detail');
    const callRef = useRef(null);
    const isSpeakerRef = useRef(false);
    const chatEndRef = useRef(null);
    const [participants, setParticipants] = useState({});
    const [count, setCount] = useState(0);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [requested, setRequested] = useState(false);
    const [requests, setRequests] = useState({}); // host only: sessionId -> name

    useEffect(() => {
        let cancelled = false;
        const call = Daily.createCallObject();
        callRef.current = call;

        const refresh = () => {
            if (cancelled) return;
            const all = call.participants();
            setParticipants({ ...all });
            const c = call.participantCounts();
            setCount((c?.present || 0) + (c?.hidden || 0));

            // Guest: react to being promoted / demoted by a host
            if (isHost) return;
            const speaker = canSendAudio(all.local);
            if (speaker && !isSpeakerRef.current) {
                isSpeakerRef.current = true;
                setRequested(false);
                toast.success(t('youAreSpeaker'));
                navigator.mediaDevices
                    .getUserMedia({ audio: true })
                    .then(async (stream) => {
                        await call.setInputDevicesAsync({ audioSource: stream.getAudioTracks()[0] });
                        call.setLocalAudio(true);
                    })
                    .catch(() => toast.error(t('micDenied')));
            } else if (!speaker && isSpeakerRef.current) {
                isSpeakerRef.current = false;
                call.setLocalAudio(false);
                call.setInputDevicesAsync({ audioSource: false }).catch(() => {});
            }
        };

        const onAppMessage = ({ data, fromId }) => {
            if (cancelled || !data?.type) return;
            if (data.type === MSG.chat) {
                // shortcut: sender name comes from the message (hidden guests aren't in participants()), so it can be spoofed
                const name = String(data.name || '').slice(0, 64);
                const text = String(data.text || '').slice(0, 500);
                if (text) setMessages((m) => [...m, { id: `${fromId}-${Date.now()}-${Math.random()}`, name, text }]);
            } else if (isHost && data.type === MSG.request) {
                setRequests((r) => ({ ...r, [fromId]: String(data.name || '').slice(0, 64) }));
            } else if (isHost && data.type === MSG.cancel) {
                setRequests(({ [fromId]: _, ...rest }) => rest);
                const p = call.participants()[fromId];
                if (p && canSendAudio(p)) {
                    call.updateParticipant(fromId, { updatePermissions: { hasPresence: false, canSend: false } });
                }
            } else if (!isHost && data.type === MSG.deny) {
                setRequested(false);
            }
        };

        const onLeft = () => !cancelled && onLeave?.();
        const onFatal = (e) => !cancelled && onError?.(e?.errorMsg || e?.error?.msg || 'Meeting error');

        call.on('joined-meeting', refresh)
            .on('participant-joined', refresh)
            .on('participant-updated', refresh)
            .on('participant-left', refresh)
            .on('participant-counts-updated', refresh)
            .on('app-message', onAppMessage)
            .on('left-meeting', onLeft)
            .on('error', onFatal);

        call.join(
            isHost
                ? { url: roomUrl, token }
                : { url: roomUrl, token, videoSource: false, audioSource: false, startVideoOff: true, startAudioOff: true }
        ).catch((err) => !cancelled && onFatal({ errorMsg: err?.message }));

        return () => {
            cancelled = true;
            callRef.current = null;
            call.destroy().catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, roomUrl, isHost]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ block: 'end' });
    }, [messages]);

    const call = callRef.current;
    const local = participants.local;
    const myName = local?.user_name || '';
    const list = Object.values(participants);
    const hostPresent = list.some((p) => p.owner);
    const screen = list.find((p) => playable(p, 'screenVideo'));
    const cams = list.filter((p) => p.owner || canSendAudio(p));
    const main = screen ? null : cams.find((p) => p.owner && playable(p, 'video')) || cams.find((p) => p.owner);
    const thumbs = cams.filter((p) => p !== main);
    const speakers = list.filter((p) => !p.local && !p.owner && canSendAudio(p));
    const isSpeaker = !isHost && canSendAudio(local);
    const label = (p) => (p.local ? t('you') : p.user_name) + (p.owner ? ` · ${t('host')}` : '');

    const sendChat = (e) => {
        e.preventDefault();
        const text = draft.trim().slice(0, 500);
        if (!text || !call) return;
        call.sendAppMessage({ type: MSG.chat, name: myName, text }, '*');
        setMessages((m) => [...m, { id: `me-${Date.now()}`, name: myName, text, mine: true }]);
        setDraft('');
    };

    const toggleRequest = () => {
        if (!call) return;
        call.sendAppMessage({ type: requested ? MSG.cancel : MSG.request, name: myName }, '*');
        setRequested(!requested);
    };

    const stopSpeaking = () => {
        if (!call) return;
        call.setLocalAudio(false);
        call.sendAppMessage({ type: MSG.cancel, name: myName }, '*');
    };

    const allow = (id) => {
        call?.updateParticipant(id, { updatePermissions: { hasPresence: true, canSend: ['audio'] } });
        setRequests(({ [id]: _, ...rest }) => rest);
    };
    const deny = (id) => {
        call?.sendAppMessage({ type: MSG.deny }, id);
        setRequests(({ [id]: _, ...rest }) => rest);
    };
    const removeSpeaker = (id) =>
        call?.updateParticipant(id, { updatePermissions: { hasPresence: false, canSend: false } });

    const ctrl = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors';
    const micOn = !!call?.localAudio();
    const camOn = !!call?.localVideo();
    const sharing = !!playable(local, 'screenVideo');

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:h-[80vh]">
            {/* Remote audio (host + promoted speakers) */}
            {list.filter((p) => !p.local && playable(p, 'audio')).map((p) => (
                <Track key={`a-${p.session_id}`} audio track={playable(p, 'audio')} />
            ))}

            {/* Stage */}
            <div className="flex-1 flex flex-col bg-gray-900 rounded-lg p-3 gap-3 min-h-[50vh]">
                <div className="relative flex-1 flex flex-col md:flex-row gap-3 min-h-0">
                    <div className="flex-1 min-h-[30vh] flex">
                        {screen ? (
                            <div className="w-full h-full bg-black rounded-lg overflow-hidden">
                                <Track track={playable(screen, 'screenVideo')} className="w-full h-full object-contain" />
                            </div>
                        ) : main ? (
                            <Tile p={main} label={label(main)} big />
                        ) : null}
                    </div>
                    {thumbs.length > 0 && (
                        <div className="md:w-64 grid grid-cols-2 md:grid-cols-1 gap-3 content-start overflow-y-auto">
                            {thumbs.map((p) => <Tile key={p.session_id} p={p} label={label(p)} />)}
                        </div>
                    )}
                    {!isHost && !hostPresent && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 rounded-lg" aria-live="polite">
                            <div className="animate-pulse rounded-full w-16 h-16 bg-blue-500/30 mb-4" />
                            <p className="text-white text-lg font-medium">{tDetail('waitingForHost')}</p>
                            <p className="text-gray-400 text-sm mt-1">{tDetail('waitingForHostSubtext')}</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                {(isHost || isSpeaker) && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <button onClick={() => call?.setLocalAudio(!micOn)} className={`${ctrl} ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                            {micOn ? t('mute') : t('unmute')}
                        </button>
                        {isHost && (
                            <>
                                <button onClick={() => call?.setLocalVideo(!camOn)} className={`${ctrl} ${camOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                                    {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                                    {camOn ? t('stopCamera') : t('startCamera')}
                                </button>
                                <button onClick={() => (sharing ? call?.stopScreenShare() : call?.startScreenShare())} className={`${ctrl} bg-gray-700 text-white hover:bg-gray-600`}>
                                    {sharing ? <MonitorX size={18} /> : <MonitorUp size={18} />}
                                    {sharing ? t('stopShare') : t('shareScreen')}
                                </button>
                            </>
                        )}
                        {isSpeaker && (
                            <button onClick={stopSpeaking} className={`${ctrl} bg-gray-700 text-white hover:bg-gray-600`}>
                                <X size={18} />
                                {t('stopSpeaking')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Side panel */}
            <aside className="lg:w-96 h-[60vh] lg:h-auto flex flex-col bg-white rounded-lg shadow">
                <div className="flex items-center justify-between gap-2 p-3 border-b">
                    {!isHost && !isSpeaker ? (
                        <button
                            onClick={toggleRequest}
                            className={`${ctrl} ${requested ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            <Hand size={18} />
                            {requested ? t('cancelRequest') : t('requestToSpeak')}
                        </button>
                    ) : (
                        <span className="font-semibold text-gray-900">{t('chat')}</span>
                    )}
                    <span className="flex items-center gap-1 text-sm text-gray-600" title={t('participants', { count })}>
                        <Users size={16} />
                        {count}
                    </span>
                </div>

                {isHost && (Object.keys(requests).length > 0 || speakers.length > 0) && (
                    <div className="p-3 border-b space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-xs font-semibold uppercase text-gray-500">{t('speakRequests')}</p>
                        {Object.entries(requests).map(([id, name]) => (
                            <div key={id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="flex items-center gap-2 truncate"><Hand size={14} className="text-blue-600 shrink-0" />{name}</span>
                                <span className="flex gap-1 shrink-0">
                                    <button onClick={() => allow(id)} className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200" title={t('allow')} aria-label={t('allow')}><Check size={16} /></button>
                                    <button onClick={() => deny(id)} className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200" title={t('deny')} aria-label={t('deny')}><X size={16} /></button>
                                </span>
                            </div>
                        ))}
                        {speakers.map((p) => (
                            <div key={p.session_id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="flex items-center gap-2 truncate"><Mic size={14} className="text-green-600 shrink-0" />{p.user_name}</span>
                                <button onClick={() => removeSpeaker(p.session_id)} className="text-xs text-red-600 hover:underline shrink-0">{t('removeSpeaker')}</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 && <p className="text-sm text-gray-400 text-center mt-6">{t('noMessages')}</p>}
                    {messages.map((m) => (
                        <div key={m.id}>
                            <p className={`text-sm font-semibold ${m.mine ? 'text-blue-700' : 'text-gray-900'}`}>{m.mine ? t('you') : m.name}</p>
                            <p className="text-sm text-gray-700 break-words">{m.text}</p>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendChat} className="flex items-center gap-2 p-3 border-t">
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={500}
                        placeholder={t('typeMessage')}
                        aria-label={t('typeMessage')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={!draft.trim()} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" aria-label={t('send')}>
                        <Send size={18} />
                    </button>
                </form>
            </aside>
        </div>
    );
}
