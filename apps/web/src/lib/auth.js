import apiClient from "./api";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const authService = {
  signUp: async (userData) => {
    const response = await apiClient.post("/api/auth/signup", userData);
    if (response.data.session) {
      localStorage.setItem("access_token", response.data.session.access_token);
      localStorage.setItem(
        "refresh_token",
        response.data.session.refresh_token
      );
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signIn: async (email, password) => {
    const response = await apiClient.post("/api/auth/signin", {
      email,
      password,
    });
    if (response.data.session) {
      localStorage.setItem("access_token", response.data.session.access_token);
      localStorage.setItem(
        "refresh_token",
        response.data.session.refresh_token
      );
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signInWithGoogle: async () => {
    const token = localStorage.getItem("access_token");
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true
    };
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.post(
      `${API_URL}/api/auth/google`,
      {},
      config
    );
    return response.data;
  },

  handleOAuthCallback: async (code) => {
    const token = localStorage.getItem("access_token");
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true
    };
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.get(
      `${API_URL}/api/auth/callback?code=${code}`,
      config
    );
    if (response.data.session) {
      localStorage.setItem("access_token", response.data.session.access_token);
      localStorage.setItem(
        "refresh_token",
        response.data.session.refresh_token
      );
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signOut: async () => {
    try {
      await apiClient.post("/api/auth/signout");
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/api/auth/me");
      return response.data.user;
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      throw error;
    }
  },

  getStoredUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  },
};
