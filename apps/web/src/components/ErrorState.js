"use client";

import { useTranslations } from 'next-intl';

export function ErrorState({ 
  message, 
  actionLabel,
  onAction,
  fullScreen = false
}) {
  const t = useTranslations();
  const displayMessage = message || t('errorState.somethingWentWrong');
  const displayActionLabel = actionLabel || t('common.retry');
  const containerClasses = fullScreen
    ? "flex items-center justify-center min-h-[calc(100vh-5rem)]"
    : "flex items-center justify-center min-h-[400px]";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-red-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-red-600 mb-4 text-lg font-medium">{displayMessage}</p>
        {onAction && (
          <button
            onClick={onAction}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {displayActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

