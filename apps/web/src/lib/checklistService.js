import apiClient from "./api";

export const checklistService = {
    getQuestions: async (locale = 'ar') => {
        const response = await apiClient.get("/api/checklist", {
            params: { locale }
        });
        return response.data;
    },
    submitChecklistResponse: async (answers, registrationData) => {
        const response = await apiClient.post("/api/checklist/submit", {
            ...registrationData,
            answers,
        });
        return response.data;
    },
};
