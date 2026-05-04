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

  // 90 Circle subscription payments
  createSubscriptionPaymentIntent: async () => {
    const response = await apiClient.post("/api/payments/subscription/create-intent");
    return response.data;
  },

  confirmSubscriptionPayment: async (paymentIntentId) => {
    const response = await apiClient.post("/api/payments/subscription/confirm", { paymentIntentId });
    return response.data;
  },

  // Individual session package payments
  createSessionPackagePaymentIntent: async (packageType, category) => {
    const response = await apiClient.post("/api/payments/session-package/create-intent", {
      packageType,
      category,
    });
    return response.data;
  },

  confirmSessionPackagePayment: async (paymentIntentId) => {
    const response = await apiClient.post("/api/payments/session-package/confirm", { paymentIntentId });
    return response.data;
  },

  // Get current user's subscription + session package status
  getSubscriptionStatus: async () => {
    const response = await apiClient.get("/api/payments/subscription/status");
    return response.data;
  },
};

