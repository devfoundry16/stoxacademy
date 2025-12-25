import apiClient from "./api";

export const courseService = {
  getAllCourses: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.level) params.append("level", filters.level);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    
    const response = await apiClient.get(`/api/courses?${params.toString()}`);
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await apiClient.get(`/api/courses/${id}`);
    return response.data;
  },

  purchaseCourse: async (courseId) => {
    const response = await apiClient.post("/api/courses/purchase", { courseId });
    return response.data;
  },

  getUserCourses: async () => {
    const response = await apiClient.get("/api/courses/user/courses");
    return response.data;
  },

  updateLessonProgress: async (lessonId, completed = false) => {
    const response = await apiClient.post("/api/courses/lesson/progress", {
      lessonId,
      completed,
    });
    return response.data;
  },
};

