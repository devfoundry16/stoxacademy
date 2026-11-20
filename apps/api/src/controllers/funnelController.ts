import { Request, Response } from "express";
import { waitUntil } from "@vercel/functions";
import { supabaseAdmin } from "../config/supabase";
import { Webinar } from "../config/webinar";
import { syncLeadToHubSpot } from "../services/hubspotService";
import { enrollWithoutPayment, findOrCreateGuestUser } from "./paymentController";
import {
    getUpcomingWebinar,
    processWebinarNotifications,
    scheduleWebinarNotifications,
} from "../services/webinarNotificationService";

/**
 * Gives the registrant a site account and enrolls them in the (free) webinar session, so the
 * session link in their emails works once they sign in. Never throws: messages still go out.
 */
async function enrollRegistrant(
    registrationId: string,
    webinar: Webinar,
    person: { email: string; fullName: string; phone: string }
): Promise<void> {
    try {
        const [firstName, ...rest] = String(person.fullName).trim().split(/\s+/);
        const { userId } = await findOrCreateGuestUser(String(person.email).trim(), firstName, rest.join(" "), person.phone);
        await supabaseAdmin.from("webinar_registrations").update({ user_id: userId }).eq("id", registrationId);
        // Never hand out a paid session for free.
        if (webinar.price === 0) await enrollWithoutPayment(userId, webinar.id);
        else console.warn("Webinar session is not free; registrant not auto-enrolled:", webinar.id);
    } catch (err) {
        console.error("Webinar auto-enroll error:", err);
    }
}

export const submitWebinarRegistration = async (req: Request, res: Response) => {
    try {
        const { fullName, email, phone, country } = req.body;

        if (!fullName || !email || !phone || !country) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // The form sends the full international number (E.164), e.g. +972528268954.
        if (!/^\+[1-9]\d{7,14}$/.test(String(phone))) {
            return res.status(400).json({ error: "Invalid phone number" });
        }

        // Still save the lead when no webinar is scheduled; they just get no messages.
        const webinar = await getUpcomingWebinar();
        if (!webinar) console.warn("Webinar registration without an upcoming webinar session:", email);

        const { data: registration, error } = await supabaseAdmin
            .from("webinar_registrations")
            .insert({
                full_name: fullName,
                email: String(email).toLowerCase().trim(),
                phone_number: phone,
                country,
                live_session_id: webinar?.id ?? null,
            })
            .select("id, created_at")
            .single();

        // 23505 = unique violation: this email is already registered for this webinar.
        if (error?.code === "23505") {
            return res.status(409).json({ error: "This email is already registered" });
        }
        if (error) {
            console.error("Webinar registration error:", error);
            return res.status(500).json({ error: "Failed to save registration" });
        }

        // waitUntil keeps the Vercel function alive after the response, so the form doesn't wait for HubSpot or email.
        waitUntil(
            Promise.all([
                syncLeadToHubSpot({ email, fullName, phone, country, source: "webinar" }),
                webinar &&
                    enrollRegistrant(registration.id, webinar, { email, fullName, phone })
                        .then(() => scheduleWebinarNotifications(registration.id, new Date(registration.created_at), webinar.startsAt))
                        .then(() => processWebinarNotifications(registration.id))
                        .catch((err) => console.error("Webinar notification error:", err)),
            ])
        );

        return res.status(201).json({ success: true });
    } catch (error: any) {
        console.error("Webinar registration error:", error);
        return res.status(500).json({ error: error.message });
    }
};
