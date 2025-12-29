import { Request, Response } from "express";
import { getSupabaseClient } from "../config/supabase";
import fs from "fs";
import path from "path";

export const submitChecklistResponse = async (req: Request, res: Response) => {
    try {
        const { full_name, email, phone_number, age, country, answers } = req.body;

        // Basic validation
        if (!full_name || !email || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const supabase = getSupabaseClient();

        // Check if email already exists
        const { data: existingResponse, error: checkError } = await supabase
            .from("checklist_responses")
            .select("email")
            .eq("email", email)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means "no rows found" for .single()
            console.error("Supabase check error:", checkError);
            return res.status(500).json({ error: "Failed to check existing response" });
        }

        if (existingResponse) {
            return res.status(409).json({
                error: "This email has already been submitted. Each user can only submit once."
            });
        }

        // Insert new response
        const { data, error } = await supabase
            .from("checklist_responses")
            .insert([
                {
                    full_name,
                    email,
                    phone_number,
                    age,
                    country,
                    answers,
                },
            ])
            .select();

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: "Failed to save response" });
        }

        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getChecklistQuestions = async (_req: Request, res: Response) => {
    try {
        const filePath = path.join(__dirname, "../../checklist/checklist.json");
        const fileData = fs.readFileSync(filePath, "utf-8");
        const questions = JSON.parse(fileData);

        return res.json({ success: true, data: questions });
    } catch (error) {
        console.error("Error reading checklist file:", error);
        return res.status(500).json({ error: "Failed to fetch questions" });
    }
};
