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
