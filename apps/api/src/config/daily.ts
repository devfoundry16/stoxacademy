import dotenv from "dotenv";

dotenv.config();

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = process.env.DAILY_API_URL || "https://api.daily.co/v1";

if (!DAILY_API_KEY) {
    console.warn("Missing DAILY_API_KEY - video meeting features will be disabled");
}

export const dailyConfig = {
    apiKey: DAILY_API_KEY,
    apiUrl: DAILY_API_URL,
    isConfigured: !!DAILY_API_KEY,
};
