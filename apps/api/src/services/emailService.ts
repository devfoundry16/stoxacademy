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
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@stoxacademy.com';
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
        console.log('From:', options.from || 'noreply@stoxacademy.com');
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

