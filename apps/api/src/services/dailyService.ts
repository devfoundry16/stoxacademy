import { dailyConfig } from "../config/daily";

const DAILY_API_URL = dailyConfig.apiUrl;
const DAILY_API_KEY = dailyConfig.apiKey;

export interface CreateRoomOptions {
    roomName: string;
    scheduledAt: string; // ISO date string
    durationMinutes: number;
    maxParticipants?: number;
}

export interface CreateRoomResult {
    name: string;
    url: string;
}

export interface CreateMeetingTokenOptions {
    roomName: string;
    exp: number; // Unix timestamp (seconds)
    nbf: number; // Unix timestamp (seconds)
    userId?: string;
    userName?: string;
}

async function dailyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!DAILY_API_KEY) {
        throw new Error("Daily.co is not configured. Set DAILY_API_KEY.");
    }
    const url = `${DAILY_API_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DAILY_API_KEY}`,
            ...options.headers,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Daily API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

/**
 * Delete a Daily.co room. Ends the meeting and prevents new joins.
 * Idempotent: 404 (room not found) is treated as success.
 */
export async function deleteRoom(roomName: string): Promise<void> {
    if (!DAILY_API_KEY) return;
    const url = `${DAILY_API_URL}/rooms/${encodeURIComponent(roomName)}`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
        },
    });
    if (res.status === 404) return; // Room already deleted
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Daily API error ${res.status}: ${text}`);
    }
}

/**
 * Create a Daily.co room for a live session.
 * Room name must be [A-Za-z0-9_-], max 128 chars.
 */
export async function createRoom(options: CreateRoomOptions): Promise<CreateRoomResult> {
    const { roomName, scheduledAt, durationMinutes, maxParticipants } = options;
    const start = new Date(scheduledAt).getTime();
    const nbfSec = Math.floor(start / 1000) - 15 * 60; // 15 min before
    const expSec = Math.floor(start / 1000) + durationMinutes * 60;

    const body: Record<string, unknown> = {
        name: roomName,
        privacy: "private",
        properties: {
            nbf: nbfSec,
            exp: expSec,
            enable_network_ui: true,
            start_video_off: true,
            start_audio_off: true,
        },
    };
    if (maxParticipants != null && maxParticipants > 0) {
        (body.properties as Record<string, unknown>).max_participants = maxParticipants;
    }

    const room = await dailyFetch<{ name: string; url: string }>("/rooms", {
        method: "POST",
        body: JSON.stringify(body),
    });
    return { name: room.name, url: room.url };
}

/**
 * Create a meeting token for a participant to join a room.
 * Token is valid only for the given room and within [nbf, exp].
 * Daily API expects all token params under a "properties" object.
 */
export async function createMeetingToken(options: CreateMeetingTokenOptions): Promise<string> {
    const { roomName, exp, nbf, userId, userName } = options;
    const properties: Record<string, unknown> = {
        room_name: roomName,
        exp,
        nbf,
    };
    if (userId) properties.user_id = userId;
    if (userName) properties.user_name = userName;

    const result = await dailyFetch<{ token: string }>("/meeting-tokens", {
        method: "POST",
        body: JSON.stringify({ properties }),
    });
    return result.token;
}

export function isDailyConfigured(): boolean {
    return dailyConfig.isConfigured;
}

/** Session status derived from Daily.co meeting state */
export type DailySessionStatus = "scheduled" | "live" | "completed";

interface MeetingSession {
    id: string;
    room: string;
    start_time: number;
    duration: number;
    ongoing: boolean;
}

interface MeetingsResponse {
    total_count: number;
    data: MeetingSession[];
}

/**
 * Check if a Daily.co room still exists (not deleted). Returns false on 404 or error.
 */
async function roomExists(roomName: string): Promise<boolean> {
    if (!DAILY_API_KEY) return false;
    const url = `${DAILY_API_URL}/rooms/${encodeURIComponent(roomName)}`;
    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DAILY_API_KEY}`,
        },
    });
    return res.ok; // 200 = exists, 404 = deleted
}

/**
 * Get live session status from Daily.co for a room.
 * - If the room was deleted (GET /rooms/:name → 404), returns 'completed' (meeting.ongoing can stay true after delete).
 * - Otherwise uses GET /meetings?room=name&limit=1: ongoing true → 'live', ongoing false → 'completed', no meeting → 'scheduled'.
 * Returns null on API error or when Daily is not configured.
 */
export async function getRoomMeetingStatus(roomName: string): Promise<DailySessionStatus | null> {
    if (!DAILY_API_KEY) return null;
    try {
        // Deleted rooms return 404; meeting.ongoing may still be true, so treat missing room as completed
        const exists = await roomExists(roomName);
        if (!exists) return "completed";

        const path = `/meetings?room=${encodeURIComponent(roomName)}&limit=1`;
        const res = await fetch(`${DAILY_API_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DAILY_API_KEY}`,
            },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Daily API error ${res.status}: ${text}`);
        }
        const json = (await res.json()) as MeetingsResponse;
        const meeting = json.data?.[0];
        if (!meeting) return "scheduled";
        return meeting.ongoing ? "live" : "completed";
    } catch {
        return null;
    }
}
