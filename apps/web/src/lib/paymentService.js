import apiClient from "./api";

export const paymentService = {
  // Course payments
  createCoursePaymentIntent: async (courseId) => {
    const response = await apiClient.post("/api/payments/course/create-intent", { courseId });
    return response.data;
  },

  confirmCoursePayment: async (paymentIntentId) => {
    const response = await apiClient.post("/api/payments/course/confirm", { paymentIntentId });
    return response.data;
  },

  // Live session payments
  createLiveSessionPaymentIntent: async (sessionId) => {
    const response = await apiClient.post("/api/payments/live-session/create-intent", { sessionId });
    return response.data;
  },

  confirmLiveSessionPayment: async (paymentIntentId) => {
    const response = await apiClient.post("/api/payments/live-session/confirm", { paymentIntentId });
    return response.data;
  },
};
