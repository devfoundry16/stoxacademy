/**
 * Email Queue Service
 * 
 * Manages scheduled email sending and queue processing
 */

import { supabaseAdmin } from "../config/supabase";
import { sendEmail } from "./emailService";
import {
    getEmail1Template,
    getEmail2Template,
    getEmail3Template,
    getEmail4Template,
} from "../templates/emailTemplates";

type EmailType = 'score_delivery' | 'education' | 'soft_cta' | 'direct_cta';

interface ScheduleEmailParams {
    checklistResponseId: string;
    email: string;
    fullName: string;
    score: number;
    stage: 'awareness' | 'builder' | 'professional' | 'investor';
    emailType: EmailType;
    scheduledFor: Date;
}

/**
 * Schedule an email to be sent at a specific time
 */
export async function scheduleEmail(params: ScheduleEmailParams): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from('email_queue')
        .insert([
            {
                checklist_response_id: params.checklistResponseId,
                email: params.email,
                full_name: params.fullName,
                email_type: params.emailType,
                stage: params.stage,
                score: params.score,
                scheduled_for: params.scheduledFor.toISOString(),
                status: 'pending',
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Error scheduling email:', error);
        throw new Error(`Failed to schedule email: ${error.message}`);
    }

    return data.id;
}

/**
 * Schedule all 4 emails for a checklist response
 */
export async function scheduleAllEmails(
    checklistResponseId: string,
    email: string,
    fullName: string,
    score: number,
    stage: 'awareness' | 'builder' | 'professional' | 'investor',
    submittedAt: Date = new Date()
): Promise<void> {
    const schedules = [
        { type: 'score_delivery' as EmailType, delay: 0 }, // Instant
        { type: 'education' as EmailType, delay: 24 * 60 * 60 * 1000 }, // +24h
        { type: 'soft_cta' as EmailType, delay: 48 * 60 * 60 * 1000 }, // +48h
        { type: 'direct_cta' as EmailType, delay: 72 * 60 * 60 * 1000 }, // +72h
    ];

    for (const schedule of schedules) {
        const scheduledFor = new Date(submittedAt.getTime() + schedule.delay);
        
        try {
            await scheduleEmail({
                checklistResponseId,
                email,
                fullName,
                score,
                stage,
                emailType: schedule.type,
                scheduledFor,
            });
        } catch (error) {
            console.error(`Failed to schedule ${schedule.type} email:`, error);
            // Continue with other emails even if one fails
        }
    }
}

/**
 * Get email template based on type
 */
function getEmailTemplate(
    emailType: EmailType,
    data: { fullName: string; score: number; stage: 'awareness' | 'builder' | 'professional' | 'investor' }
) {
    switch (emailType) {
        case 'score_delivery':
            return getEmail1Template(data);
        case 'education':
            return getEmail2Template(data);
        case 'soft_cta':
            return getEmail3Template(data);
        case 'direct_cta':
            return getEmail4Template(data);
        default:
            throw new Error(`Unknown email type: ${emailType}`);
    }
}

/**
 * Process and send a single email from the queue
 */
export async function processEmailQueueItem(queueId: string): Promise<boolean> {
    // Get the email from queue
    const { data: queueItem, error: fetchError } = await supabaseAdmin
        .from('email_queue')
        .select('*')
        .eq('id', queueId)
        .eq('status', 'pending')
        .single();

    if (fetchError || !queueItem) {
        console.error('Error fetching queue item:', fetchError);
        return false;
    }

    // Check if it's time to send
    const scheduledFor = new Date(queueItem.scheduled_for);
    const now = new Date();

    if (now < scheduledFor) {
        // Not time yet, skip
        return false;
    }

    // Mark as processing (optional, or just send directly)
    try {
        // Get email template
        const template = getEmailTemplate(queueItem.email_type as EmailType, {
            fullName: queueItem.full_name,
            score: queueItem.score,
            stage: queueItem.stage as 'awareness' | 'builder' | 'professional' | 'investor',
        });

        // Send email
        const result = await sendEmail({
            to: queueItem.email,
            subject: template.subject,
            html: template.html,
        });

        // Update queue status
        const updateData: any = {
            status: result.success ? 'sent' : 'failed',
            sent_at: result.success ? new Date().toISOString() : null,
        };

        if (!result.success) {
            updateData.error_message = result.error || 'Unknown error';
        }

        const { error: updateError } = await supabaseAdmin
            .from('email_queue')
            .update(updateData)
            .eq('id', queueId);

        if (updateError) {
            console.error('Error updating queue item:', updateError);
            return false;
        }

        return result.success;
    } catch (error: any) {
        // Mark as failed
        await supabaseAdmin
            .from('email_queue')
            .update({
                status: 'failed',
                error_message: error.message || 'Unknown error',
            })
            .eq('id', queueId);

        console.error('Error processing email:', error);
        return false;
    }
}

/**
 * Process all pending emails that are due
 */
export async function processEmailQueue(): Promise<number> {
    const now = new Date().toISOString();

    // Get all pending emails that are due
    const { data: pendingEmails, error } = await supabaseAdmin
        .from('email_queue')
        .select('id')
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .limit(50); // Process in batches

    if (error) {
        console.error('Error fetching pending emails:', error);
        return 0;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
        return 0;
    }

    let processed = 0;
    for (const email of pendingEmails) {
        const success = await processEmailQueueItem(email.id);
        if (success) {
            processed++;
        }
    }

    return processed;
}

/**
 * Send email immediately (for instant emails like Email #1)
 */
export async function sendEmailImmediately(
    email: string,
    fullName: string,
    score: number,
    stage: 'awareness' | 'builder' | 'professional' | 'investor',
    emailType: EmailType = 'score_delivery'
): Promise<boolean> {
    try {
        const template = getEmailTemplate(emailType, {
            fullName,
            score,
            stage,
        });

        const result = await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
        });

        return result.success;
    } catch (error) {
        console.error('Error sending immediate email:', error);
        return false;
    }
}

