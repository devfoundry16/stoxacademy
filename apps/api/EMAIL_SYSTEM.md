# Automated Email System

## Overview

The automated email system sends 4 stage-specific emails to users after they complete the Financial Readiness Assessment:

1. **Email #1 (Instant)**: Score delivery and initial guidance
2. **Email #2 (+24h)**: Education and trust building
3. **Email #3 (+48h)**: Soft conversion with transformation path
4. **Email #4 (+72h)**: Direct CTA with urgency

## Email Flow

Each email is customized based on the user's stage:
- **Awareness** (0-3 score)
- **Builder** (4-6 score)
- **Professional** (7-8.5 score)
- **Investor** (9-10 score)

## Setup

### 1. Database Migration

Run the email queue table migration:

```sql
-- Execute: apps/api/migrations/create_email_queue_table.sql
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# Email Service Configuration
EMAIL_API_KEY=your_email_api_key_here
EMAIL_API_URL=https://api.resend.com/emails  # or your email provider URL
EMAIL_FROM=noreply@stoxacademy.com
EMAIL_FROM_NAME=STOX Academy

# Frontend URL (for email links)
FRONTEND_URL=https://stoxacademy.com
```

### 3. Email Provider Options

The system supports any HTTP-based email API. Examples:

#### Resend (Recommended)
```env
EMAIL_API_KEY=re_xxxxxxxxxxxxx
EMAIL_API_URL=https://api.resend.com/emails
```

#### SendGrid
```env
EMAIL_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_API_URL=https://api.sendgrid.com/v3/mail/send
```

**Note**: For SendGrid, you may need to adjust the request format in `emailService.ts` to match their API.

#### Development Mode
If `EMAIL_API_KEY` is not set in development, emails will be logged to the console instead of being sent.

## How It Works

### 1. Checklist Submission

When a user submits the checklist:
- Score and stage are calculated
- **Email #1 is sent immediately** (score delivery)
- Emails #2, #3, and #4 are **scheduled** in the database

### 2. Email Worker

A background worker runs every 5 minutes to:
- Check for pending emails that are due
- Send them via the email service
- Update their status in the database

The worker starts automatically when the server starts.

### 3. Email Queue

All scheduled emails are stored in the `email_queue` table with:
- `scheduled_for`: When to send the email
- `status`: `pending`, `sent`, or `failed`
- `sent_at`: Timestamp when sent (if successful)
- `error_message`: Error details (if failed)

## Manual Operations

### Process Email Queue Manually

```typescript
import { runEmailWorkerOnce } from './jobs/emailWorker';

// Process all due emails once
const processed = await runEmailWorkerOnce();
console.log(`Processed ${processed} emails`);
```

### Send Email Immediately

```typescript
import { sendEmailImmediately } from './services/emailQueueService';

await sendEmailImmediately(
    'user@example.com',
    'John Doe',
    6.5,
    'builder',
    'score_delivery'
);
```

### Check Email Status

Query the `email_queue` table to see email status:

```sql
SELECT 
    email,
    email_type,
    stage,
    score,
    status,
    scheduled_for,
    sent_at,
    error_message
FROM email_queue
WHERE checklist_response_id = 'your-response-id'
ORDER BY scheduled_for;
```

## Email Templates

Templates are located in `src/templates/emailTemplates.ts` and include:

- Stage-specific content
- Dynamic variables: `{fullName}`, `{score}`, `{stage}`, etc.
- Responsive HTML design
- CTA buttons with tracking parameters

### Customizing Templates

Edit the template functions in `emailTemplates.ts`:
- `getEmail1Template()` - Score delivery
- `getEmail2Template()` - Education
- `getEmail3Template()` - Soft CTA
- `getEmail4Template()` - Direct CTA

## Monitoring

### Check Failed Emails

```sql
SELECT * FROM email_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Retry Failed Emails

You can manually retry failed emails by updating their status:

```sql
UPDATE email_queue 
SET status = 'pending', error_message = NULL 
WHERE id = 'failed-email-id';
```

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set correctly
2. Verify email API key is valid
3. Check server logs for errors
4. Verify email worker is running (check server startup logs)

### Emails Stuck in Pending

1. Check if email worker is running
2. Verify `scheduled_for` timestamps are in the past
3. Manually trigger the worker: `runEmailWorkerOnce()`

### Email Provider Errors

- Check API key permissions
- Verify sender email is verified/authorized
- Check rate limits
- Review error messages in `email_queue.error_message`

## Production Considerations

1. **Use a proper job queue** (Bull, BullMQ, etc.) for better reliability
2. **Set up monitoring** for failed emails
3. **Implement retry logic** with exponential backoff
4. **Add email analytics** (open rates, click rates)
5. **Set up alerts** for high failure rates
6. **Consider using Supabase Edge Functions** for email processing

## Future Enhancements

- [ ] Email open/click tracking
- [ ] A/B testing for email content
- [ ] Unsubscribe functionality
- [ ] Email preferences management
- [ ] Advanced retry logic with exponential backoff
- [ ] Integration with analytics tools

