"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthInitializer({ children }) {
  const initialize = useAuthStore((state) => state.initialize);
  const setupStorageListener = useAuthStore((state) => state.setupStorageListener);

  useEffect(() => {
    // Initialize auth state
    initialize();

    // Setup storage listener
    const cleanup = setupStorageListener();

    // Cleanup on unmount
    return cleanup;
  }, [initialize, setupStorageListener]);

  return <>{children}</>;
}

