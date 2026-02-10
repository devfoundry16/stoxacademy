/**
 * Financial Readiness Score Calculator
 * 
 * Calculates a score (0-10) based on 4 pillars:
 * - Pillar 1: Knowledge & Experience (Question 2 - Current Level)
 * - Pillar 2: Goal Clarity & Commitment (Question 1 - Goal + Question 7 - Time Commitment)
 * - Pillar 3: Financial Readiness (Question 4 - Capital)
 * - Pillar 4: Risk Mindset & Psychology (Question 5 - Risk Tolerance + Question 9 - Biggest Challenge)
 */

interface ChecklistAnswer {
    question: string;
    answer: string;
}

interface ScoreResult {
    score: number;
    stage: 'awareness' | 'builder' | 'professional' | 'investor';
    pillarScores: {
        pillar1: number;
        pillar2: number;
        pillar3: number;
        pillar4: number;
    };
}

/**
 * Language-agnostic mappings for questions and answers
 * Maps both English and Arabic text to canonical keys
 */

// Question mappings: maps question text (EN/AR) to question key
const QUESTION_MAP: Record<string, string> = {
    // Question 1: Goal
    "What is your real goal in financial markets?": "goal",
    "ما هو هدفك الحقيقي في الأسواق المالية؟": "goal",
    
    // Question 2: Current Level
    "How would you describe your current level?": "current_level",
    "كيف تصف مستواك الحالي؟": "current_level",
    
    // Question 4: Capital
    "How much capital can you start with?": "capital",
    "كم رأس المال الذي يمكنك البدء به؟": "capital",
    
    // Question 5: Risk
    "How do you deal with risk?": "risk",
    "كيف تتعامل مع المخاطر؟": "risk",
    
    // Question 7: Time Commitment
    "How much time can you dedicate weekly?": "time_commitment",
    "كم من الوقت يمكنك أن تخصّص أسبوعيًا؟": "time_commitment",
    
    // Question 9: Biggest Challenge
    "Your biggest challenge right now?": "biggest_challenge",
    "أكبر تحدٍ تواجهه الآن؟": "biggest_challenge",
};

// Answer mappings: maps answer text (EN/AR) to answer key
const ANSWER_MAP: Record<string, string> = {
    // Goal answers
    "Build an extra income": "goal_extra_income",
    "بناء دخل إضافي": "goal_extra_income",
    "Achieve stable monthly incomes": "goal_stable_income",
    "تحقيق دخل شهري مستقر": "goal_stable_income",
    "Grow existing capital": "goal_grow_capital",
    "تنمية رأس المال الحالي": "goal_grow_capital",
    "Learn trading professionally": "goal_learn_professionally",
    "تعلم التداول بشكل احترافي": "goal_learn_professionally",
    "Still exploring my direction": "goal_exploring",
    "ما زلت أستكشف اتجاهي": "goal_exploring",
    
    // Current Level answers
    "Complete beginner": "level_beginner",
    "مبتدئ تماماً": "level_beginner",
    "Basic theoretical knowledge": "level_basic_theory",
    "معرفة نظرية أساسية": "level_basic_theory",
    "Tried trading and faced losses": "level_tried_losses",
    "جربت التداول وواجهت خسائر": "level_tried_losses",
    "Trading without a clear system": "level_no_system",
    "التداول بدون نظام واضح": "level_no_system",
    "Trading with a system and results": "level_with_system",
    "التداول بنظام وتحقيق نتائج": "level_with_system",
    
    // Capital answers
    "I want to learn first": "capital_learn_first",
    "أريد أن أتعلم أولاً": "capital_learn_first",
    "Less than $1,000": "capital_less_1000",
    "أقل من 1000 دولار": "capital_less_1000",
    "$1,000 - $5,000": "capital_1000_5000",
    "1000 - 5000 دولار": "capital_1000_5000",
    "$5,000 - $15,000": "capital_5000_15000",
    "5000 - 15000 دولار": "capital_5000_15000",
    "More than $15,000": "capital_more_15000",
    "أكثر من 15000 دولار": "capital_more_15000",
    
    // Risk answers
    "Very cautious": "risk_very_cautious",
    "حذر جدًا": "risk_very_cautious",
    "Calculated risk": "risk_calculated",
    "مخاطرة محسوبة": "risk_calculated",
    "High risk tolerance": "risk_high_tolerance",
    "قدرة عالية على تحمل المخاطر": "risk_high_tolerance",
    "I need guidance": "risk_need_guidance",
    "أحتاج إلى إرشاد": "risk_need_guidance",
    
    // Time Commitment answers
    "Less than 3 hours": "time_less_3",
    "أقل من 3 ساعات": "time_less_3",
    "3 - 6 hours": "time_3_6",
    "من 3 إلى 6 ساعات": "time_3_6",
    "6 - 10 hours": "time_6_10",
    "من 6 إلى 10 ساعات": "time_6_10",
    "More than 10 hours": "time_more_10",
    "أكثر من 10 ساعات": "time_more_10",
    
    // Biggest Challenge answers
    "Fear of loss": "challenge_fear_loss",
    "الخوف من الخسارة": "challenge_fear_loss",
    "Lack of understanding": "challenge_lack_understanding",
    "عدم الإلمام": "challenge_lack_understanding",
    "No clear system": "challenge_no_system",
    "عدم وجود نظام واضح": "challenge_no_system",
    "Discipline issues": "challenge_discipline",
    "مشاكل الانضباط": "challenge_discipline",
    "Lack of guidance": "challenge_lack_guidance",
    "نقص التوجيه": "challenge_lack_guidance",
};

/**
 * Normalize question text to canonical key
 */
function normalizeQuestion(questionText: string): string | null {
    return QUESTION_MAP[questionText] || null;
}

/**
 * Normalize answer text to canonical key
 */
function normalizeAnswer(answerText: string): string | null {
    if (!answerText) return null;
    
    // Try exact match first (handles both English and Arabic)
    if (ANSWER_MAP[answerText]) {
        return ANSWER_MAP[answerText];
    }
    
    // Normalize whitespace
    const normalizedText = answerText.trim().replace(/\s+/g, ' ');
    
    // Try exact match with normalized whitespace
    if (ANSWER_MAP[normalizedText]) {
        return ANSWER_MAP[normalizedText];
    }
    
    // Try case-insensitive matching for English
    const answerLower = normalizedText.toLowerCase();
    for (const [key, value] of Object.entries(ANSWER_MAP)) {
        const keyNormalized = key.trim().replace(/\s+/g, ' ');
        if (keyNormalized.toLowerCase() === answerLower) {
            return value;
        }
    }
    
    // Try partial matching (for both English and Arabic)
    // This handles variations in formatting
    for (const [key, value] of Object.entries(ANSWER_MAP)) {
        const keyNormalized = key.trim().replace(/\s+/g, ' ');
        const keyLower = keyNormalized.toLowerCase();
        
        // Check if either string contains the other (case-insensitive for English)
        if (keyLower.includes(answerLower) || answerLower.includes(keyLower)) {
            return value;
        }
        
        // For Arabic, also try direct comparison (Arabic is case-insensitive)
        if (keyNormalized === normalizedText) {
            return value;
        }
    }
    
    return null;
}

/**
 * Find answer by normalized question key
 */
function findAnswerByQuestionKey(answers: ChecklistAnswer[], questionKey: string): string | null {
    for (const answer of answers) {
        const normalizedQuestion = normalizeQuestion(answer.question);
        if (normalizedQuestion === questionKey) {
            const normalizedAnswer = normalizeAnswer(answer.answer);
            return normalizedAnswer;
        }
    }
    return null;
}

/**
 * Calculate Pillar 1: Knowledge & Experience (0-2.5)
 * Based on Question 2: "How would you describe your current level?"
 */
function calculatePillar1(answers: ChecklistAnswer[]): number {
    const answerKey = findAnswerByQuestionKey(answers, "current_level");
    
    if (!answerKey) return 0;
    
    // Score based on normalized answer keys
    switch (answerKey) {
        case "level_beginner":
            return 0.5;
        case "level_basic_theory":
            return 1.0;
        case "level_tried_losses":
            return 1.5;
        case "level_no_system":
            return 2.0;
        case "level_with_system":
            return 2.5;
        default:
            return 0.5; // Default to lowest score
    }
}

/**
 * Calculate Pillar 2: Goal Clarity & Commitment (0-2.5)
 * Based on Question 1 (Goal) + Question 7 (Time Commitment)
 */
function calculatePillar2(answers: ChecklistAnswer[]): number {
    const goalKey = findAnswerByQuestionKey(answers, "goal");
    const timeKey = findAnswerByQuestionKey(answers, "time_commitment");
    
    if (!goalKey || !timeKey) return 0;
    
    // Check if goal is unclear
    const isGoalUnclear = goalKey === "goal_exploring";
    
    // Check time commitment
    const isLessThan3Hours = timeKey === "time_less_3";
    const is3To6Hours = timeKey === "time_3_6";
    const is6OrMoreHours = timeKey === "time_6_10" || timeKey === "time_more_10";
    
    // Scoring logic based on requirements
    if (isGoalUnclear && isLessThan3Hours) return 0.5;
    if (!isGoalUnclear && is3To6Hours) return 1.5;
    if (!isGoalUnclear && is6OrMoreHours) return 2.5;
    
    // Partial matches
    if (!isGoalUnclear && isLessThan3Hours) return 1.0;
    if (isGoalUnclear && is3To6Hours) return 1.0;
    if (isGoalUnclear && is6OrMoreHours) return 1.5;
    
    return 0.5; // Default
}

/**
 * Calculate Pillar 3: Financial Readiness (0-2.5)
 * Based on Question 4: "How much capital can you start with?"
 */
function calculatePillar3(answers: ChecklistAnswer[]): number {
    const answerKey = findAnswerByQuestionKey(answers, "capital");
    
    if (!answerKey) return 0;
    
    // Score based on normalized answer keys
    switch (answerKey) {
        case "capital_learn_first":
        case "capital_less_1000":
            return 0.5;
        case "capital_1000_5000":
            return 1.5;
        case "capital_5000_15000":
        case "capital_more_15000":
            return 2.5;
        default:
            return 0.5; // Default
    }
}

/**
 * Calculate Pillar 4: Risk Mindset & Psychology (0-2.5)
 * Based on Question 5 (Risk Tolerance) + Question 9 (Biggest Challenge)
 */
function calculatePillar4(answers: ChecklistAnswer[]): number {
    const riskKey = findAnswerByQuestionKey(answers, "risk");
    const challengeKey = findAnswerByQuestionKey(answers, "biggest_challenge");
    
    if (!riskKey || !challengeKey) return 0;
    
    // Check for fearful/doesn't understand risk
    const isFearful = riskKey === "risk_very_cautious" || 
                     riskKey === "risk_need_guidance" ||
                     challengeKey === "challenge_fear_loss" ||
                     challengeKey === "challenge_lack_understanding";
    
    // Check for accepts calculated risk
    const acceptsRisk = riskKey === "risk_calculated";
    
    // Check for understands risk & discipline (calculated risk + discipline/system challenges)
    const understandsRisk = (riskKey === "risk_calculated" || riskKey === "risk_high_tolerance") &&
                           (challengeKey === "challenge_discipline" || challengeKey === "challenge_no_system");
    
    // Scoring logic
    if (isFearful) return 0.5;
    if (acceptsRisk && !understandsRisk) return 1.5;
    if (understandsRisk) return 2.5;
    
    // If risk is calculated but challenge is fear/lack of understanding
    if (acceptsRisk && (challengeKey === "challenge_fear_loss" || challengeKey === "challenge_lack_understanding")) {
        return 1.0;
    }
    
    return 0.5; // Default
}

/**
 * Determine stage based on score
 */
function determineStage(score: number): 'awareness' | 'builder' | 'professional' | 'investor' {
    if (score >= 0 && score <= 3) return 'awareness';
    if (score >= 4 && score <= 6) return 'builder';
    if (score >= 7 && score <= 8.5) return 'professional';
    if (score >= 9 && score <= 10) return 'investor';
    
    return 'awareness'; // Default
}

/**
 * Calculate the complete Financial Readiness Score
 */
export function calculateChecklistScore(answers: ChecklistAnswer[]): ScoreResult {
    const pillar1 = calculatePillar1(answers);
    const pillar2 = calculatePillar2(answers);
    const pillar3 = calculatePillar3(answers);
    const pillar4 = calculatePillar4(answers);
    
    const totalScore = pillar1 + pillar2 + pillar3 + pillar4;
    const roundedScore = Math.round(totalScore * 10) / 10; // Round to 1 decimal place
    
    const stage = determineStage(roundedScore);
    
    return {
        score: roundedScore,
        stage,
        pillarScores: {
            pillar1,
            pillar2,
            pillar3,
            pillar4,
        },
    };
}

