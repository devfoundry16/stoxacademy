import apiClient from "./api";
import axios from "axios";
import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Helper function to set session in Supabase client for automatic refresh
const setSupabaseSession = async (session) => {
  if (session?.access_token && session?.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (error) {
      console.error("Error setting Supabase session:", error);
    }
  }
};

export const authService = {
  signUp: async (userData) => {
    const response = await apiClient.post("/api/auth/signup", userData);
    if (response.data.session) {
      // Set session in Supabase client for automatic token refresh
      await setSupabaseSession(response.data.session);
      // Also store user data in localStorage for backward compatibility
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
      // Set session in Supabase client for automatic token refresh
      await setSupabaseSession(response.data.session);
      // Also store user data in localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signInWithGoogle: async () => {
    // Get current session from Supabase client
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
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
    // Get current session from Supabase client
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.get(
      `${API_URL}/api/auth/callback?code=${code}`,
      config
    );
    if (response.data.session) {
      // Set session in Supabase client for automatic token refresh
      await setSupabaseSession(response.data.session);
      // Also store user data in localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signOut: async () => {
    try {
      // Get token before clearing session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call backend signout first (while we still have a valid token)
      if (token) {
        try {
          await apiClient.post("/api/auth/signout");
        } catch (error) {
          // If backend signout fails, continue anyway to clear local session
          console.error("Backend signout failed:", error);
        }
      }

      // Then sign out from Supabase client (this will clear the session)
      await supabase.auth.signOut();
    } finally {
      // Clear localStorage for backward compatibility
      localStorage.removeItem("user");
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/api/auth/me");
      return response.data.user;
    } catch (error) {
      // If token is invalid, sign out from Supabase
      await supabase.auth.signOut();
      localStorage.removeItem("user");
      throw error;
    }
  },

  getStoredUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Synchronous check (uses cached session, may not be 100% accurate)
  isAuthenticated: () => {
    if (typeof window === "undefined") return false;
    // Check if we have a stored user (backward compatibility)
    // The actual session check should be done via Supabase client
    const user = localStorage.getItem("user");
    return !!user;
  },

  // Async check (gets fresh session from Supabase)
  isAuthenticatedAsync: async () => {
    if (typeof window === "undefined") return false;
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Get current access token from Supabase (automatically refreshed)
  getAccessToken: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  },
};
