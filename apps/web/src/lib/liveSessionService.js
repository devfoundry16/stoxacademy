import apiClient from "./api";

export const liveSessionService = {
  getAllLiveSessions: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.course_id) params.append("course_id", filters.course_id);
    
    const response = await apiClient.get(`/api/live-sessions?${params.toString()}`);
    return response.data;
  },

  getLiveSessionById: async (id) => {
    const response = await apiClient.get(`/api/live-sessions/${id}`);
    return response.data;
  },

  enrollInLiveSession: async (sessionId) => {
    const response = await apiClient.post("/api/live-sessions/enroll", { sessionId });
    return response.data;
  },

  getUserLiveSessions: async () => {
    const response = await apiClient.get("/api/live-sessions/user/enrollments");
    return response.data;
  },
};
