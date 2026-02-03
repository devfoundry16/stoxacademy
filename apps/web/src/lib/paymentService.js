import apiClient from "./api";

export const paymentService = {
  // Course payments
  createCoursePaymentIntent: async (courseId, couponCode = null) => {
    const response = await apiClient.post("/api/payments/course/create-intent", {
      courseId,
      couponCode
    });
    return response.data;
  },

  confirmCoursePayment: async (paymentIntentId) => {
    const response = await apiClient.post("/api/payments/course/confirm", { paymentIntentId });
    return response.data;
  },

  // Live session payments
  createLiveSessionPaymentIntent: async (sessionId, couponCode = null) => {
    const response = await apiClient.post("/api/payments/live-session/create-intent", {
      sessionId,
      couponCode
    });
    return response.data;
  },

  confirmLiveSessionPayment: async (paymentIntentId) => {
    const response = await apiClient.post("/api/payments/live-session/confirm", { paymentIntentId });
    return response.data;
  },

  // Validate coupon
  validateCoupon: async (code) => {
    const response = await apiClient.get(`/api/coupons/validate/${code}`);
    return response.data;
  },
};

