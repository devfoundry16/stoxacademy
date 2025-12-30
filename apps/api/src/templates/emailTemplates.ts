/**
 * Email Templates
 * 
 * Stage-specific email templates for the automated email flow
 */

interface EmailTemplateData {
    fullName: string;
    score: number;
    stage: 'awareness' | 'builder' | 'professional' | 'investor';
    recommendedPath?: string;
}

interface EmailTemplate {
    subject: string;
    html: string;
}

/**
 * Get stage-specific content
 */
function getStageContent(stage: string) {
    const stages = {
        awareness: {
            name: 'Awareness Stage',
            description: 'You\'re just starting your journey. The most important step right now is building a solid foundation of knowledge and understanding before risking any capital.',
            mistake: 'The biggest mistake at this stage is jumping into trading without proper education. Many traders lose money because they don\'t understand the fundamentals.',
            transformation: 'In the next 90 days, you\'ll build a strong foundation: understanding market mechanics, risk management basics, and developing a beginner-friendly trading system.',
            ctaDestination: '/courses?level=beginner',
        },
        builder: {
            name: 'Building Stage',
            description: 'You already have awareness, but the missing piece is a clear system and guidance. This is exactly where most traders either level up — or stay stuck.',
            mistake: 'The biggest mistake at this stage is trading without a proven system. You have the knowledge, but without structure, you\'re still gambling.',
            transformation: 'In the next 90 days, you\'ll develop a complete trading system: entry/exit rules, risk management protocols, and the discipline to follow your plan consistently.',
            ctaDestination: '/courses?level=intermediate',
        },
        professional: {
            name: 'Professional Stage',
            description: 'You have a system and experience. Now it\'s about optimization, scaling, and maintaining consistency. You\'re close to professional-level results.',
            mistake: 'The biggest mistake at this stage is complacency. Even experienced traders need to continuously refine their systems and adapt to changing markets.',
            transformation: 'In the next 90 days, you\'ll optimize your system, learn advanced strategies, and develop the mental discipline needed for consistent professional results.',
            ctaDestination: '/courses?level=advanced',
        },
        investor: {
            name: 'Investor Stage',
            description: 'You have the knowledge, system, and discipline. You\'re ready to scale your trading and potentially mentor others. This is where true financial freedom begins.',
            mistake: 'The biggest mistake at this stage is not scaling properly or taking on too much risk. Even at this level, risk management is paramount.',
            transformation: 'In the next 90 days, you\'ll learn advanced portfolio management, scaling strategies, and potentially explore mentorship or trading education opportunities.',
            ctaDestination: '/courses?level=advanced&type=mentorship',
        },
    };

    return stages[stage as keyof typeof stages] || stages.awareness;
}

/**
 * Replace template variables
 */
function replaceVariables(template: string, data: EmailTemplateData): string {
    const stageContent = getStageContent(data.stage);
    
    return template
        .replace(/{fullName}/g, data.fullName || 'there')
        .replace(/{score}/g, data.score.toString())
        .replace(/{stage}/g, stageContent.name)
        .replace(/{stageDescription}/g, stageContent.description)
        .replace(/{mistake}/g, stageContent.mistake)
        .replace(/{transformation}/g, stageContent.transformation)
        .replace(/{ctaDestination}/g, stageContent.ctaDestination)
        .replace(/{recommendedPath}/g, data.recommendedPath || stageContent.ctaDestination);
}

/**
 * Email #1: Score Delivery (Instant)
 */
export function getEmail1Template(data: EmailTemplateData): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://stoxacademy.com';
    const stageContent = getStageContent(data.stage);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Financial Readiness Score</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Your Financial Readiness Score</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi {fullName},</p>
        
        <p>Thank you for completing the Financial Readiness Assessment!</p>
        
        <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #667eea;">
            <div style="font-size: 48px; font-weight: bold; color: #667eea; margin-bottom: 10px;">
                {score} / 10
            </div>
            <div style="font-size: 18px; color: #666; margin-bottom: 20px;">
                {stage}
            </div>
            <p style="color: #555; margin: 0;">
                {stageDescription}
            </p>
        </div>
        
        <p><strong>This is not good or bad — it's a starting point.</strong></p>
        
        <p>Every successful trader started somewhere. What matters most is having the right guidance and system to move forward.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/book-call?stage={stage}&score={score}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Book Your Guidance Call
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The STOX Academy Team
        </p>
    </div>
</body>
</html>
    `.trim();

    return {
        subject: 'Your Financial Readiness Score Is Ready',
        html: replaceVariables(html, data),
    };
}

/**
 * Email #2: Education & Trust (+24h)
 */
export function getEmail2Template(data: EmailTemplateData): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://stoxacademy.com';
    const stageContent = getStageContent(data.stage);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Why Most Traders Fail at Your Stage</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Why Most Traders Fail at Your Stage</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi {fullName},</p>
        
        <p>Based on your score of <strong>{score}/10</strong>, you're in the <strong>{stage}</strong>.</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #856404;">
                {mistake}
            </p>
        </div>
        
        <p>At STOX Academy, we've helped thousands of traders at your exact stage build structured, proven systems that eliminate guesswork and emotional trading.</p>
        
        <p>Our approach is different: we don't just teach you strategies. We give you a complete system with clear rules, risk management protocols, and the discipline framework to execute consistently.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}{ctaDestination}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                See How Professionals Build Systems
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The STOX Academy Team
        </p>
    </div>
</body>
</html>
    `.trim();

    return {
        subject: 'Why Most Traders Fail at Your Stage (And How to Avoid It)',
        html: replaceVariables(html, data),
    };
}

/**
 * Email #3: Soft CTA (+48h)
 */
export function getEmail3Template(data: EmailTemplateData): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://stoxacademy.com';
    const stageContent = getStageContent(data.stage);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Next 90 Days</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">What Your Next 90 Days Should Look Like</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi {fullName},</p>
        
        <p>Let's talk about your path forward.</p>
        
        <p><strong>{transformation}</strong></p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
            <h3 style="margin-top: 0; color: #667eea;">What This Means:</h3>
            <ul style="color: #555;">
                <li>You'll have a clear, step-by-step system (no more guessing)</li>
                <li>You'll understand risk management (protecting your capital is priority #1)</li>
                <li>You'll develop the discipline to execute consistently</li>
                <li>You'll have realistic expectations and measurable progress</li>
            </ul>
        </div>
        
        <p>This isn't about get-rich-quick schemes. It's about building sustainable, long-term trading skills that can generate consistent results.</p>
        
        <p><strong>Risk management and realism are at the core of everything we teach.</strong></p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/book-call?stage={stage}&score={score}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Talk to a STOX Advisor
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The STOX Academy Team
        </p>
    </div>
</body>
</html>
    `.trim();

    return {
        subject: 'What Your Next 90 Days Should Look Like',
        html: replaceVariables(html, data),
    };
}

/**
 * Email #4: Direct CTA (+72h)
 */
export function getEmail4Template(data: EmailTemplateData): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://stoxacademy.com';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Personalized Financial Path</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Your Personalized Financial Path Is Still Open</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi {fullName},</p>
        
        <p>Three days ago, you completed a personalized assessment that revealed your Financial Readiness Score: <strong>{score}/10</strong>.</p>
        
        <p>This wasn't a generic quiz. It was a detailed analysis of your knowledge, goals, capital readiness, and risk mindset — all designed to create a personalized path forward.</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #856404;">
                ⚠️ Limited Availability: We only have a few slots left this week for personalized guidance calls.
            </p>
        </div>
        
        <p>During your call, we'll:</p>
        <ul style="color: #555;">
            <li>Review your assessment results in detail</li>
            <li>Discuss your specific goals and challenges</li>
            <li>Recommend the best program path for your stage</li>
            <li>Answer all your questions about our approach</li>
        </ul>
        
        <p><strong>This is your chance to get personalized guidance based on your unique situation.</strong></p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/book-call?stage={stage}&score={score}&urgent=true" 
               style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Schedule Your Call Now
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The STOX Academy Team
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px; text-align: center;">
            If you're not ready yet, that's okay. We'll be here when you are.
        </p>
    </div>
</body>
</html>
    `.trim();

    return {
        subject: 'Your Personalized Financial Path Is Still Open',
        html: replaceVariables(html, data),
    };
}

