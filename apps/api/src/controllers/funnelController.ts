import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { syncLeadToHubSpot } from "../services/hubspotService";
import {
    getUpcomingWebinar,
    processWebinarNotifications,
    scheduleWebinarNotifications,
} from "../services/webinarNotificationService";

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

        await syncLeadToHubSpot({ email, fullName, phone, country, source: "webinar" });
        // Awaited: on Vercel, work left running after the response is cut off. The rest is sent by the scheduled job.
        if (webinar) {
            try {
                await scheduleWebinarNotifications(registration.id, new Date(registration.created_at), webinar.startsAt);
                await processWebinarNotifications();
            } catch (err) {
                console.error("Webinar notification error:", err);
            }
        }

        return res.status(201).json({ success: true });
    } catch (error: any) {
        console.error("Webinar registration error:", error);
        return res.status(500).json({ error: error.message });
    }
};
