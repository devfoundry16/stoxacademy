import apiClient from "./api";

export const checklistService = {
    getQuestions: async (locale = 'en') => {
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
