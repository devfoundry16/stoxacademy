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
        // Get the current session from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          return config;
        }

        if (data?.session?.access_token) {
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

// // Handle 401 errors by refreshing token and retrying request
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // If error is 401 and we haven't already retried this request
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         // If already refreshing, queue this request
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             return apiClient(originalRequest);
//           })
//           .catch((err) => {
//             return Promise.reject(err);
//           });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         // Force refresh the session
//         const { data, error: refreshError } = await supabase.auth.refreshSession();
        
//         if (refreshError || !data?.session?.access_token) {
//           // Refresh failed - session is invalid, clear it and redirect to login
//           await supabase.auth.signOut();
//           if (typeof window !== "undefined") {
//             localStorage.removeItem("user");
//             // window.location.href = "/login";
//           }
//           processQueue(refreshError || new Error("Session refresh failed"), null);
//           return Promise.reject(refreshError || new Error("Session expired"));
//         }

//         // Update the authorization header with the new token
//         const newToken = data.session.access_token;
//         originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
//         // Process queued requests
//         processQueue(null, newToken);
        
//         // Retry the original request
//         return apiClient(originalRequest);
//       } catch (refreshError) {
//         // Refresh failed - clear session and redirect
//         await supabase.auth.signOut();
//         if (typeof window !== "undefined") {
//           localStorage.removeItem("user");
//           // window.location.href = "/login";
//         }
//         processQueue(refreshError, null);
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     // For non-401 errors or if retry already attempted, just reject
//     return Promise.reject(error);
//   }
// );

export default apiClient;

