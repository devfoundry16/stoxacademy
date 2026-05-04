"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { authService } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function AuthCallbackSuspenseFallback() {
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-700 text-lg font-medium">{tCommon("loading")}</p>
      </div>
    </div>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const t = useTranslations("authCallback");
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const tr = (key) => tRef.current(key);

    const handleCallback = async () => {
      let nextPath = searchParams.get("next") ?? "/";

      // Remove any locale prefix (router.push will add it automatically)
      // Handle both /en/ and /ar/ prefixes
      const locales = ["ar", "en"];
      for (const loc of locales) {
        if (nextPath.startsWith(`/${loc}/`)) {
          nextPath = nextPath.substring(`/${loc}`.length);
          break;
        } else if (nextPath === `/${loc}`) {
          nextPath = "/";
          break;
        }
      }

      // Ensure path starts with /
      if (!nextPath.startsWith("/")) {
        nextPath = "/";
      }

      // Check for code parameter (PKCE flow)
      const code = searchParams.get("code");

      if (code) {
        try {
          await authService.handleOAuthCallback(code);
          window.dispatchEvent(new Event("auth-storage-change"));
          router.push(nextPath);
        } catch (err) {
          setError(err.response?.data?.error || tr("authenticationFailed"));
          setTimeout(() => router.push("/login"), 3000);
        }
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          const user = await authService.getCurrentUser();
          localStorage.setItem("user", JSON.stringify(user));
          window.dispatchEvent(new Event("auth-storage-change"));
          router.push(nextPath);
        } catch {
          setError(tr("failedToSetSession"));
          setTimeout(() => router.push("/login"), 3000);
        }
        return;
      }

      setError(tr("noAuthorizationCode"));
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
            <p className="text-gray-600">{t("redirectingToLogin")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium">
              {t("completingAuthentication")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<AuthCallbackSuspenseFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
