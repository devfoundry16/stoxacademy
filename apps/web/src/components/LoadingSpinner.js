"use client";

import { useTranslations } from 'next-intl';

export function LoadingSpinner({ 
  message,
  size = "md",
  fullScreen = false 
}) {
  const t = useTranslations();
  const displayMessage = message ?? t('common.loading');
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-b-2",
    lg: "h-16 w-16 border-b-2",
  };

  const containerClasses = fullScreen
    ? "flex items-center justify-center min-h-[calc(100vh-5rem)]"
    : "flex items-center justify-center min-h-[400px]";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}
        ></div>
        {displayMessage && <p className="text-gray-600">{displayMessage}</p>}
      </div>
    </div>
  );
}
