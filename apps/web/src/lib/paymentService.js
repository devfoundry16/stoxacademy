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
  createSubscriptionPaymentIntent: async (programType) => {
    const response = await apiClient.post("/api/payments/subscription/create-intent", { programType });
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

  // Guest course payments (no auth required)
  createGuestCoursePaymentIntent: async (courseId, email, firstName, lastName, couponCode = null) => {
    const response = await apiClient.post("/api/payments/course/guest-create-intent", {
      courseId,
      email,
      firstName,
      lastName,
      couponCode,
    });
    return response.data;
  },

  confirmGuestCoursePayment: async (paymentIntentId, guestToken) => {
    const response = await apiClient.post("/api/payments/course/guest-confirm", {
      paymentIntentId,
      guestToken,
    });
    return response.data;
  },

  // Guest live session payments (no auth required)
  createGuestLiveSessionPaymentIntent: async (sessionId, email, firstName, lastName, couponCode = null) => {
    const response = await apiClient.post("/api/payments/live-session/guest-create-intent", {
      sessionId,
      email,
      firstName,
      lastName,
      couponCode,
    });
    return response.data;
  },

  confirmGuestLiveSessionPayment: async (paymentIntentId, guestToken) => {
    const response = await apiClient.post("/api/payments/live-session/guest-confirm", {
      paymentIntentId,
      guestToken,
    });
    return response.data;
  },

  // Guest subscription payments (no auth required)
  createGuestSubscriptionPaymentIntent: async (email, firstName, lastName, programType) => {
    const response = await apiClient.post("/api/payments/subscription/guest-create-intent", {
      email,
      firstName,
      lastName,
      programType,
    });
    return response.data;
  },

  confirmGuestSubscriptionPayment: async (paymentIntentId, guestToken) => {
    const response = await apiClient.post("/api/payments/subscription/guest-confirm", {
      paymentIntentId,
      guestToken,
    });
    return response.data;
  },

  // Guest session package payments (no auth required)
  createGuestSessionPackagePaymentIntent: async (packageType, category, email, firstName, lastName) => {
    const response = await apiClient.post("/api/payments/session-package/guest-create-intent", {
      packageType,
      category,
      email,
      firstName,
      lastName,
    });
    return response.data;
  },

  confirmGuestSessionPackagePayment: async (paymentIntentId, guestToken) => {
    const response = await apiClient.post("/api/payments/session-package/guest-confirm", {
      paymentIntentId,
      guestToken,
    });
    return response.data;
  },
};

