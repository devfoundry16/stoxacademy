import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

export const submitWebinarRegistration = async (req: Request, res: Response) => {
    try {
        const { fullName, email, phone, country } = req.body;

        if (!fullName || !email || !phone || !country) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { error } = await supabaseAdmin.from("webinar_registrations").insert({
            full_name: fullName,
            email: String(email).toLowerCase().trim(),
            phone_number: phone,
            country,
        });

        // 23505 = unique violation: this email is already registered.
        if (error?.code === "23505") {
            return res.status(409).json({ error: "This email is already registered" });
        }
        if (error) {
            console.error("Webinar registration error:", error);
            return res.status(500).json({ error: "Failed to save registration" });
        }

        return res.status(201).json({ success: true });
    } catch (error: any) {
        console.error("Webinar registration error:", error);
        return res.status(500).json({ error: error.message });
    }
};
