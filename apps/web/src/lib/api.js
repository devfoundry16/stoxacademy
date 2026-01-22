import axios from "axios";
import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests from Supabase client (automatically refreshed)
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      try {
        // Get the current session from Supabase (token is automatically refreshed)
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session?.access_token) {
          config.headers.Authorization = `Bearer ${data.session.access_token}`;
        }
      } catch (error) {
        // If session retrieval fails, continue without token
        console.error("Error getting session:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

