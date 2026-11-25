/**
 * Gold & Forex course emails for funnel buyers: the purchase confirmation right away, then a morning
 * reminder (9:00) and a one-hour reminder (17:00) for every session still ahead, Jerusalem time.
 */

import { supabaseAdmin } from "../config/supabase";
import { DAILY_SEND_HOUR } from "../config/webinar";
import { COURSE_SESSION_DAYS, COURSE_SESSION_START_HOUR, reminderSession, renderCourseEmail } from "../templates/courseTemplates";
import { sendEmail } from "./emailService";
import { atJerusalemTime } from "./webinarNotificationService";

const HOUR_MS = 60 * 60 * 1000;

const sessionStart = (n: number) => atJerusalemTime(COURSE_SESSION_DAYS[n - 1], COURSE_SESSION_START_HOUR);

/** Buyers only get reminders for sessions still ahead of them. */
export function planCourseNotifications(purchasedAt: Date): { templateKey: string; scheduledFor: Date }[] {
    const plan = [{ templateKey: "confirmation", scheduledFor: purchasedAt }];
    COURSE_SESSION_DAYS.forEach((day, i) => {
        const n = i + 1;
        const morning = atJerusalemTime(day, DAILY_SEND_HOUR);
        const oneHour = new Date(sessionStart(n).getTime() - HOUR_MS);
        if (morning > purchasedAt) plan.push({ templateKey: `s${n}_morning`, scheduledFor: morning });
        if (oneHour > purchasedAt) plan.push({ templateKey: `s${n}_1h`, scheduledFor: oneHour });
    });
    return plan;
}

export async function scheduleCourseNotifications(userCourseId: string, email: string, fullName: string, purchasedAt: Date): Promise<void> {
    const rows = planCourseNotifications(purchasedAt).map((n) => ({
        user_course_id: userCourseId,
        email,
        full_name: fullName,
        channel: "email",
        template_key: n.templateKey,
        scheduled_for: n.scheduledFor.toISOString(),
    }));
    const { error } = await supabaseAdmin
        .from("course_notifications")
        .upsert(rows, { onConflict: "user_course_id,channel,template_key", ignoreDuplicates: true });
    if (error) console.error("Failed to schedule course notifications:", error);
}

async function finish(id: string, status: "sent" | "failed" | "skipped", error?: string) {
    await supabaseAdmin
        .from("course_notifications")
        .update({ status, sent_at: status === "sent" ? new Date().toISOString() : null, error_message: error ?? null })
        .eq("id", id);
}

/** Sends due course emails (only one purchase's when given). Returns how many were sent. */
export async function processCourseNotifications(userCourseId?: string): Promise<number> {
    const now = new Date();
    let query = supabaseAdmin
        .from("course_notifications")
        .select("id, email, full_name, template_key")
        .eq("status", "pending")
        .lte("scheduled_for", now.toISOString())
        .order("scheduled_for")
        .limit(100);
    if (userCourseId) query = query.eq("user_course_id", userCourseId);
    const { data: due, error } = await query;
    if (error) {
        console.error("Error fetching course notifications:", error);
        return 0;
    }

    let sent = 0;
    for (const item of due ?? []) {
        // Claim the row so two workers never send the same message.
        const { data: claimed } = await supabaseAdmin
            .from("course_notifications")
            .update({ status: "processing" })
            .eq("id", item.id)
            .eq("status", "pending")
            .select("id");
        if (!claimed?.length) continue;

        const session = reminderSession(item.template_key);
        if (session && now >= sessionStart(session)) {
            await finish(item.id, "skipped", "Out of date");
            continue;
        }
        try {
            const { subject, html } = renderCourseEmail(item.template_key, item.full_name);
            const result = await sendEmail({ to: item.email, subject, html });
            await finish(item.id, result.success ? "sent" : "failed", result.error);
            if (result.success) sent++;
        } catch (err: any) {
            await finish(item.id, "failed", err.message || "Unknown error");
        }
    }
    return sent;
}
