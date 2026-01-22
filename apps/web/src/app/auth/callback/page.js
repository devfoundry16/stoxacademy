"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Check for code parameter (PKCE flow)
      const code = searchParams.get("code");
      
      if (code) {
        // Handle PKCE flow with code exchange
        try {
          await authService.handleOAuthCallback(code);
          // Dispatch event to update auth store
          window.dispatchEvent(new Event("auth-storage-change"));
          router.push("/");
        } catch (err) {
          setError(err.response?.data?.error || "Authentication failed");
          setTimeout(() => router.push("/login"), 3000);
        }
        return;
      }

      // Check for tokens in hash (implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        // Set session in Supabase client for automatic token refresh
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            throw sessionError;
          }
          
          // Fetch user data
          const user = await authService.getCurrentUser();
          localStorage.setItem("user", JSON.stringify(user));
          // Dispatch event to update auth store
          window.dispatchEvent(new Event("auth-storage-change"));
          router.push("/");
        } catch (err) {
          setError("Failed to set session or fetch user data");
          setTimeout(() => router.push("/login"), 3000);
        }
        return;
      }

      // No code or tokens found
      setError("No authorization code or tokens found");
      setTimeout(() => router.push("/login"), 3000);
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        {error ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-red-600 text-xl font-semibold mb-4">
              {error}
            </div>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">
              Completing authentication...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

