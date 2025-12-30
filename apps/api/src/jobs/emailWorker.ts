/**
 * Email Worker
 * 
 * Background job processor for scheduled emails
 * Runs periodically to check and send pending emails
 */

import { processEmailQueue } from "../services/emailQueueService";

let intervalId: NodeJS.Timeout | null = null;
const PROCESS_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Start the email worker
 */
export function startEmailWorker(): void {
    if (intervalId) {
        console.log('Email worker already running');
        return;
    }

    console.log('Starting email worker...');

    // Process immediately on start
    processEmailQueue().then((processed) => {
        if (processed > 0) {
            console.log(`Processed ${processed} emails on startup`);
        }
    });

    // Then process every interval
    intervalId = setInterval(async () => {
        try {
            const processed = await processEmailQueue();
            if (processed > 0) {
                console.log(`Processed ${processed} emails`);
            }
        } catch (error) {
            console.error('Error in email worker:', error);
        }
    }, PROCESS_INTERVAL);

    console.log(`Email worker started (checking every ${PROCESS_INTERVAL / 1000 / 60} minutes)`);
}

/**
 * Stop the email worker
 */
export function stopEmailWorker(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('Email worker stopped');
    }
}

/**
 * Process emails once (for manual triggers or testing)
 */
export async function runEmailWorkerOnce(): Promise<number> {
    return processEmailQueue();
}

