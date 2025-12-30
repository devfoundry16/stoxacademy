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
 * Calculate Pillar 1: Knowledge & Experience (0-2.5)
 * Based on Question 2: "How would you describe your current level?"
 */
function calculatePillar1(answers: ChecklistAnswer[]): number {
    const question1 = answers.find(a => 
        a.question === "How would you describe your current level?"
    );
    
    if (!question1) return 0;
    
    const answer = question1.answer;
    
    // Exact matching based on checklist options
    if (answer === "Complete beginner") return 0.5;
    if (answer === "Basic theoretical knowledge") return 1.0;
    if (answer === "Tried trading and faced losses") return 1.5;
    if (answer === "Trading without a clear system") return 2.0;
    if (answer === "Trading with a system and results") return 2.5;
    
    // Fallback case-insensitive matching
    const answerLower = answer.toLowerCase();
    if (answerLower.includes("complete beginner")) return 0.5;
    if (answerLower.includes("basic theoretical")) return 1.0;
    if (answerLower.includes("tried trading") && answerLower.includes("loss")) return 1.5;
    if (answerLower.includes("trading without") || answerLower.includes("no clear system")) return 2.0;
    if (answerLower.includes("trading with a system") || answerLower.includes("system and results")) return 2.5;
    
    return 0.5; // Default to lowest score
}

/**
 * Calculate Pillar 2: Goal Clarity & Commitment (0-2.5)
 * Based on Question 1 (Goal) + Question 7 (Time Commitment)
 */
function calculatePillar2(answers: ChecklistAnswer[]): number {
    const goalQuestion = answers.find(a => 
        a.question === "What is your real goal in financial markets?"
    );
    const timeQuestion = answers.find(a => 
        a.question === "How much time can you dedicate weekly?"
    );
    
    if (!goalQuestion || !timeQuestion) return 0;
    
    const goal = goalQuestion.answer;
    const time = timeQuestion.answer;
    
    // Check if goal is unclear (exact match)
    const isGoalUnclear = goal === "Still exploring my direction";
    
    // Check time commitment (exact matches)
    const isLessThan3Hours = time === "Less than 3 hours";
    const is3To6Hours = time === "3 - 6 hours";
    const is6OrMoreHours = time === "6 - 10 hours" || time === "More than 10 hours";
    
    // Scoring logic based on requirements
    if (isGoalUnclear && isLessThan3Hours) return 0.5;
    if (!isGoalUnclear && is3To6Hours) return 1.5;
    if (!isGoalUnclear && is6OrMoreHours) return 2.5;
    
    // Fallback case-insensitive matching
    const goalLower = goal.toLowerCase();
    const timeLower = time.toLowerCase();
    const isGoalUnclearFallback = goalLower.includes("still exploring") || goalLower.includes("not sure");
    const isLessThan3HoursFallback = timeLower.includes("less than 3");
    const is3To6HoursFallback = timeLower.includes("3 - 6") || timeLower.includes("3-6");
    const is6OrMoreHoursFallback = timeLower.includes("6 - 10") || timeLower.includes("more than 10") || 
                                   timeLower.includes("6-10");
    
    if (isGoalUnclearFallback && isLessThan3HoursFallback) return 0.5;
    if (!isGoalUnclearFallback && is3To6HoursFallback) return 1.5;
    if (!isGoalUnclearFallback && is6OrMoreHoursFallback) return 2.5;
    
    // Partial matches
    if (!isGoalUnclearFallback && isLessThan3HoursFallback) return 1.0;
    if (isGoalUnclearFallback && is3To6HoursFallback) return 1.0;
    if (isGoalUnclearFallback && is6OrMoreHoursFallback) return 1.5;
    
    return 0.5; // Default
}

/**
 * Calculate Pillar 3: Financial Readiness (0-2.5)
 * Based on Question 4: "How much capital can you start with?"
 */
function calculatePillar3(answers: ChecklistAnswer[]): number {
    const capitalQuestion = answers.find(a => 
        a.question === "How much capital can you start with?"
    );
    
    if (!capitalQuestion) return 0;
    
    const answer = capitalQuestion.answer;
    
    // Exact matching based on checklist options
    if (answer === "I want to learn first") return 0.5;
    if (answer === "Less than $1,000") return 0.5;
    if (answer === "$1,000 - $5,000") return 1.5;
    if (answer === "$5,000 - $15,000" || answer === "More than $15,000") return 2.5;
    
    // Fallback case-insensitive matching
    const answerLower = answer.toLowerCase();
    if (answerLower.includes("want to learn first") || answerLower.includes("learn first")) return 0.5;
    if (answerLower.includes("less than $1,000") || answerLower.includes("< $1,000")) return 0.5;
    if (answerLower.includes("$1,000 - $5,000") || answerLower.includes("$1,000-$5,000")) return 1.5;
    if (answerLower.includes("$5,000") || answerLower.includes("$15,000") || answerLower.includes("more than $15")) return 2.5;
    
    return 0.5; // Default
}

/**
 * Calculate Pillar 4: Risk Mindset & Psychology (0-2.5)
 * Based on Question 5 (Risk Tolerance) + Question 9 (Biggest Challenge)
 */
function calculatePillar4(answers: ChecklistAnswer[]): number {
    const riskQuestion = answers.find(a => 
        a.question === "How do you deal with risk?"
    );
    const challengeQuestion = answers.find(a => 
        a.question === "Your biggest challenge right now?"
    );
    
    if (!riskQuestion || !challengeQuestion) return 0;
    
    const risk = riskQuestion.answer;
    const challenge = challengeQuestion.answer;
    
    // Exact matching first
    const riskLower = risk.toLowerCase();
    const challengeLower = challenge.toLowerCase();
    
    // Check for fearful/doesn't understand risk
    const isFearful = risk === "Very cautious" || 
                     risk === "I need guidance" ||
                     challenge === "Fear of loss" ||
                     challenge === "Lack of understanding";
    
    // Check for accepts calculated risk
    const acceptsRisk = risk === "Calculated risk";
    
    // Check for understands risk & discipline (calculated risk + discipline/system challenges)
    const understandsRisk = (risk === "Calculated risk" || risk === "High risk tolerance") &&
                           (challenge === "Discipline issues" || challenge === "No clear system");
    
    // Scoring logic
    if (isFearful) return 0.5;
    if (acceptsRisk && !understandsRisk) return 1.5;
    if (understandsRisk) return 2.5;
    
    // Fallback case-insensitive matching
    const isFearfulFallback = riskLower.includes("very cautious") || 
                             riskLower.includes("need guidance") ||
                             challengeLower.includes("fear of loss") ||
                             challengeLower.includes("lack of understanding");
    
    const acceptsRiskFallback = riskLower.includes("calculated risk");
    const understandsRiskFallback = (riskLower.includes("calculated risk") || riskLower.includes("high risk tolerance")) &&
                                   (challengeLower.includes("discipline") || challengeLower.includes("no clear system"));
    
    if (isFearfulFallback) return 0.5;
    if (acceptsRiskFallback && !understandsRiskFallback && 
        !challengeLower.includes("fear") && !challengeLower.includes("lack of understanding")) {
        return 1.5;
    }
    if (understandsRiskFallback || (acceptsRiskFallback && 
        (challengeLower.includes("discipline") || challengeLower.includes("no clear system")))) {
        return 2.5;
    }
    
    // If risk is calculated but challenge is fear/lack of understanding
    if (acceptsRiskFallback && (challengeLower.includes("fear") || challengeLower.includes("lack of understanding"))) {
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

