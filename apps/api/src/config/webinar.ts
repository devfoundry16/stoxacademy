// The webinar's date and link come from its live session (live_sessions.session_type = 'webinar').
export const WEBINAR_TZ = "Asia/Jerusalem";
export const DAILY_SEND_HOUR = 9; // countdown emails and day-based WhatsApp reminders go out at 9:00 AM Jerusalem time
export const SUPPORT_NUMBER = "+972528268954";

export interface Webinar {
    id: string;
    startsAt: Date;
}

export function webinarLink(id: string): string {
    return `${process.env.FRONTEND_URL || "https://stoxacademy.org"}/en/live-sessions/${id}`;
}

/** Wall-clock parts of an instant in Jerusalem. */
export function jerusalemParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number } {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: WEBINAR_TZ,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hourCycle: "h23",
    }).formatToParts(d);
    const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
    return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}
