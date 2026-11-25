/**
 * Free webinar notifications: plans emails/WhatsApp per registrant and sends them when due.
 *
 * Countdown emails depend on when the person registered: from the day after registration until the
 * webinar morning they get one email a day, and the email for each day matches the days left
 * (email n goes out with 14 - n days left). Late registrants simply start further down the list.
 */

import { supabaseAdmin } from "../config/supabase";
import { DAILY_SEND_HOUR, Webinar, WEBINAR_TZ } from "../config/webinar";
import { renderWebinarEmail, whatsappParams } from "../templates/webinarTemplates";
import { sendEmail } from "./emailService";
import { sendWhatsAppTemplate } from "./whatsappService";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_LATE_MS = 12 * HOUR_MS; // a reminder later than this is out of date ("3 days left" sent a day late)
const WHATSAPP_DAYS_BEFORE = [10, 8, 6, 4, 2];

export interface PlannedNotification {
    channel: "email" | "whatsapp";
    templateKey: string;
    scheduledFor: Date;
}

/** Calendar date (YYYY-MM-DD) of an instant in Jerusalem. */
function jerusalemDate(d: Date): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: WEBINAR_TZ }).format(d);
}

/** The instant when it is `hour`:00 on `ymd` in Jerusalem (handles summer/winter time). */
export function atJerusalemTime(ymd: string, hour: number): Date {
    const asUtc = new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00Z`);
    const offset = new Intl.DateTimeFormat("en-US", { timeZone: WEBINAR_TZ, timeZoneName: "longOffset" })
        .formatToParts(asUtc)
        .find((p) => p.type === "timeZoneName")!.value; // e.g. "GMT+02:00"
    const m = offset.match(/([+-])(\d{2}):(\d{2})/);
    const minutes = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
    return new Date(asUtc.getTime() - minutes * 60 * 1000);
}

const addDays = (ymd: string, n: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

/** The next free webinar people can register for: the soonest upcoming, not cancelled webinar live session. */
export async function getUpcomingWebinar(): Promise<Webinar | null> {
    const { data, error } = await supabaseAdmin
        .from("live_sessions")
        .select("id, scheduled_at, duration")
        .eq("session_type", "webinar")
        .in("status", ["scheduled", "live"])
        .gt("scheduled_at", new Date().toISOString())
        .order("scheduled_at")
        .limit(1)
        .maybeSingle();
    if (error) console.error("Error loading upcoming webinar:", error);
    return data
        ? { id: data.id, startsAt: new Date(data.scheduled_at), durationMinutes: data.duration || 60 }
        : null;
}

export function planWebinarNotifications(registeredAt: Date, start: Date, durationMinutes = 60): PlannedNotification[] {
    if (registeredAt >= start) return [];
    const webinarDay = jerusalemDate(start);

    const plan: PlannedNotification[] = [
        { channel: "email", templateKey: "confirmation", scheduledFor: registeredAt },
        { channel: "whatsapp", templateKey: "confirmation", scheduledFor: registeredAt },
    ];

    const regDay = jerusalemDate(registeredAt);
    const totalDays = daysBetween(regDay, webinarDay);
    for (let d = 1; d <= totalDays; d++) {
        const daysLeft = totalDays - d;
        if (daysLeft > 13) continue; // only 14 countdown emails exist
        plan.push({
            channel: "email",
            templateKey: `countdown_${14 - daysLeft}`,
            scheduledFor: atJerusalemTime(addDays(regDay, d), DAILY_SEND_HOUR),
        });
    }

    for (const days of WHATSAPP_DAYS_BEFORE) {
        const at = atJerusalemTime(addDays(webinarDay, -days), DAILY_SEND_HOUR);
        if (at > registeredAt) plan.push({ channel: "whatsapp", templateKey: `reminder_${days}d`, scheduledFor: at });
    }

    const oneHourBefore = new Date(start.getTime() - HOUR_MS);
    if (oneHourBefore > registeredAt) {
        plan.push({ channel: "email", templateKey: "reminder_1h", scheduledFor: oneHourBefore });
        plan.push({ channel: "whatsapp", templateKey: "reminder_1h", scheduledFor: oneHourBefore });
    }

    // Course invitation one hour after the webinar ends.
    plan.push({
        channel: "email",
        templateKey: "post_webinar",
        scheduledFor: new Date(start.getTime() + durationMinutes * 60 * 1000 + HOUR_MS),
    });

    return plan;
}

// shortcut: the plan is fixed at registration; if a webinar is rescheduled, its pending rows must be re-planned.
export async function scheduleWebinarNotifications(
    registrationId: string,
    registeredAt: Date,
    start: Date,
    durationMinutes?: number
): Promise<void> {
    const rows = planWebinarNotifications(registeredAt, start, durationMinutes).map((n) => ({
        registration_id: registrationId,
        channel: n.channel,
        template_key: n.templateKey,
        scheduled_for: n.scheduledFor.toISOString(),
    }));
    if (!rows.length) return;

    const { error } = await supabaseAdmin
        .from("webinar_notifications")
        .upsert(rows, { onConflict: "registration_id,channel,template_key", ignoreDuplicates: true });
    if (error) console.error("Failed to schedule webinar notifications:", error);
}

async function finish(id: string, status: "sent" | "failed" | "skipped", error?: string) {
    await supabaseAdmin
        .from("webinar_notifications")
        .update({ status, sent_at: status === "sent" ? new Date().toISOString() : null, error_message: error ?? null })
        .eq("id", id);
}

/** Sends due webinar notifications (only one registration's when given). Returns how many were sent. */
export async function processWebinarNotifications(registrationId?: string): Promise<number> {
    const now = new Date();
    let query = supabaseAdmin
        .from("webinar_notifications")
        .select("id, channel, template_key, scheduled_for, webinar_registrations(full_name, email, phone_number, live_sessions(id, scheduled_at, status))")
        .eq("status", "pending")
        .lte("scheduled_for", now.toISOString())
        .order("scheduled_for")
        .limit(100);
    if (registrationId) query = query.eq("registration_id", registrationId);
    const { data: due, error } = await query;

    if (error) {
        console.error("Error fetching webinar notifications:", error);
        return 0;
    }

    let sent = 0;
    for (const item of due ?? []) {
        // Claim the row so two workers never send the same message.
        const { data: claimed } = await supabaseAdmin
            .from("webinar_notifications")
            .update({ status: "processing" })
            .eq("id", item.id)
            .eq("status", "pending")
            .select("id");
        if (!claimed?.length) continue;

        const reg: any = Array.isArray(item.webinar_registrations) ? item.webinar_registrations[0] : item.webinar_registrations;
        const session: any = Array.isArray(reg?.live_sessions) ? reg.live_sessions[0] : reg?.live_sessions;
        if (!reg || !session) {
            await finish(item.id, "skipped", "Registration or webinar not found");
            continue;
        }
        if (session.status === "cancelled") {
            await finish(item.id, "skipped", "Webinar cancelled");
            continue;
        }
        const webinar: Webinar = { id: session.id, startsAt: new Date(session.scheduled_at) };

        const late = now.getTime() - new Date(item.scheduled_for).getTime();
        const afterWebinar = item.template_key === "post_webinar"; // the only message meant for after the start
        if ((!afterWebinar && now >= webinar.startsAt) || (item.template_key !== "confirmation" && late > MAX_LATE_MS)) {
            await finish(item.id, "skipped", "Out of date");
            continue;
        }

        try {
            if (item.channel === "email") {
                const { subject, html } = renderWebinarEmail(item.template_key, reg.full_name, webinar);
                const result = await sendEmail({ to: reg.email, subject, html });
                await finish(item.id, result.success ? "sent" : "failed", result.error);
                if (result.success) sent++;
            } else {
                const { name, params } = whatsappParams(item.template_key, reg.full_name, webinar);
                const result = await sendWhatsAppTemplate(reg.phone_number, name, params);
                await finish(item.id, result.success ? "sent" : result.skipped ? "skipped" : "failed", result.error);
                if (result.success) sent++;
            }
        } catch (err: any) {
            await finish(item.id, "failed", err.message || "Unknown error");
        }
    }
    return sent;
}
