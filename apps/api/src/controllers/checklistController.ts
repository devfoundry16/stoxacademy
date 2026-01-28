import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { calculateChecklistScore } from "../utils/checklistScoring";
import { sendEmailImmediately, scheduleAllEmails } from "../services/emailQueueService";
import fs from "fs";
import path from "path";

export const submitChecklistResponse = async (req: Request, res: Response) => {
    try {
        const { full_name, email, phone_number, age, country, answers } = req.body;

        // Basic validation
        if (!full_name || !email || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if email already exists
        const { data: existingResponse, error: checkError } = await supabaseAdmin
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

        // Calculate score and stage
        const scoreResult = calculateChecklistScore(answers);
        const { score, stage } = scoreResult;

        // Insert new response with score and stage
        const { data, error } = await supabaseAdmin
            .from("checklist_responses")
            .insert([
                {
                    full_name,
                    email,
                    phone_number,
                    age,
                    country,
                    answers,
                    score,
                    stage,
                },
            ])
            .select();

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: "Failed to save response" });
        }

        const checklistResponseId = data[0].id;
        const submittedAt = new Date(data[0].created_at || new Date());

        // Send Email #1 immediately (score delivery)
        try {
            await sendEmailImmediately(
                email,
                full_name,
                score,
                stage as 'awareness' | 'builder' | 'professional' | 'investor',
                'score_delivery'
            );
        } catch (emailError) {
            console.error("Error sending immediate email:", emailError);
            // Don't fail the request if email fails
        }

        // Schedule remaining emails (+24h, +48h, +72h)
        try {
            await scheduleAllEmails(
                checklistResponseId,
                email,
                full_name,
                score,
                stage as 'awareness' | 'builder' | 'professional' | 'investor',
                submittedAt
            );
        } catch (scheduleError) {
            console.error("Error scheduling emails:", scheduleError);
            // Don't fail the request if scheduling fails
        }

        return res.status(201).json({ 
            success: true, 
            data: {
                ...data[0],
                score,
                stage,
                pillarScores: scoreResult.pillarScores,
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getChecklistQuestions = async (req: Request, res: Response) => {
    try {
        // Get locale from query parameter, default to 'en'
        const locale = (req.query.locale as string) || 'en';
        
        // Determine which file to load based on locale
        const fileName = locale === 'ar' ? 'checklist.ar.json' : 'checklist.json';
        const filePath = path.join(__dirname, "../../checklist", fileName);
        
        // Check if file exists, fallback to English if not
        if (!fs.existsSync(filePath)) {
            console.warn(`Checklist file for locale '${locale}' not found, falling back to English`);
            const fallbackPath = path.join(__dirname, "../../checklist/checklist.json");
            const fileData = fs.readFileSync(fallbackPath, "utf-8");
            const questions = JSON.parse(fileData);
            return res.json({ success: true, data: questions });
        }
        
        const fileData = fs.readFileSync(filePath, "utf-8");
        const questions = JSON.parse(fileData);

        return res.json({ success: true, data: questions });
    } catch (error) {
        console.error("Error reading checklist file:", error);
        return res.status(500).json({ error: "Failed to fetch questions" });
    }
};
