/**
 * Email Service
 * 
 * Handles sending emails through configured email provider
 * Supports multiple providers (Resend, SendGrid, etc.)
 */

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface EmailProvider {
    send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Simple SMTP/HTTP Email Provider
 * Can be configured to use Resend, SendGrid, or any HTTP-based email API
 */
class HttpEmailProvider implements EmailProvider {
    private apiKey: string;
    private apiUrl: string;
    private fromEmail: string;
    private fromName: string;

    constructor() {
        this.apiKey = process.env.EMAIL_API_KEY || '';
        this.apiUrl = process.env.EMAIL_API_URL || 'https://api.resend.com/emails';
        this.fromEmail = process.env.EMAIL_FROM || 'admin@stoxacademy.org';
        this.fromName = process.env.EMAIL_FROM_NAME || 'STOX Academy';
    }

    async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.apiKey) {
            console.warn('Email API key not configured. Email not sent:', options.to);
            return { success: false, error: 'Email API key not configured' };
        }

        try {
            // Default to Resend API format, but can be adapted for other providers
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: options.from || `${this.fromName} <${this.fromEmail}>`,
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                }),
            });

            let data: any;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = text ? { message: text } : {};
            }

            if (!response.ok) {
                return { 
                    success: false, 
                    error: data.message || data.error || `HTTP ${response.status}` 
                };
            }

            return { 
                success: true, 
                messageId: data.id || data.message_id || data.messageId || 'unknown' 
            };
        } catch (error: any) {
            console.error('Email send error:', error);
            return { 
                success: false, 
                error: error.message || 'Unknown error' 
            };
        }
    }
}

/**
 * Console Email Provider (for development/testing)
 */
class ConsoleEmailProvider implements EmailProvider {
    async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        console.log('\n========== EMAIL ==========');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('From:', options.from || 'admin@stoxacademy.org');
        console.log('HTML:', options.html);
        console.log('==========================\n');
        
        return { 
            success: true, 
            messageId: `console-${Date.now()}` 
        };
    }
}

// Initialize email provider based on environment
const getEmailProvider = (): EmailProvider => {
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_API_KEY) {
        return new ConsoleEmailProvider();
    }
    return new HttpEmailProvider();
};

const emailProvider = getEmailProvider();

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return emailProvider.send(options);
}


const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Confirmation email after a logged-in user buys or books something.
 * Never throws: a failed email must not fail a paid booking.
 */
export async function sendBookingConfirmation(
    to: string | undefined,
    item: string,
    details: string[] = [],
    // Guest buyers get "Set your password" here instead of "Go to My Courses"
    action?: { label: string; url: string; note?: string },
): Promise<void> {
    if (!to) return;
    try {
        const button = action || { label: 'Go to My Courses', url: `${process.env.FRONTEND_URL || 'https://stoxacademy.org'}/en/my-courses` };
        const detailRows = details.map((d) => `<li style="margin-bottom:6px;">${escapeHtml(d)}</li>`).join('');
        const result = await sendEmail({
            to,
            subject: `Booking confirmed: ${item}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
                    <h2 style="color:#1e3a5f;margin-bottom:8px;">Your booking is confirmed</h2>
                    <p style="color:#374151;margin-bottom:16px;">
                        Thank you! You're booked in for <strong>${escapeHtml(item)}</strong>.
                    </p>
                    ${detailRows ? `<ul style="color:#374151;padding-left:20px;margin-bottom:24px;">${detailRows}</ul>` : ''}
                    ${button.note ? `<p style="color:#374151;margin-bottom:16px;">${escapeHtml(button.note)}</p>` : ''}
                    <a href="${button.url}"
                       style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        ${escapeHtml(button.label)}
                    </a>
                    <p style="color:#6b7280;font-size:13px;margin-top:24px;">
                        ${action ? 'This link expires in 24 hours. If it has expired, use "Forgot password" on the login page with this email address. ' : ''}Questions? Just reply to this email.
                    </p>
                </div>
            `,
        });
        if (!result.success) console.error('Booking confirmation email failed:', to, result.error);
    } catch (err: any) {
        console.error('Booking confirmation email error:', to, err?.message);
    }
}
