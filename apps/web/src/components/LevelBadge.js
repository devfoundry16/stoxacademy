"use client";

import { useTranslations } from 'next-intl';

const levelColors = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-blue-100 text-blue-700",
  Advanced: "bg-purple-100 text-purple-700",
};

export function LevelBadge({ level, className = "" }) {
  const t = useTranslations('courses.page');
  
  // Helper function to translate level values for display
  const translateLevel = (level) => {
    if (!level) return '';
    const levelLower = level.toLowerCase();
    switch (levelLower) {
      case 'beginner':
        return t('beginner');
      case 'intermediate':
        return t('intermediate');
      case 'advanced':
        return t('advanced');
      default:
        return level;
    }
  };

  // Get color class based on level (case-insensitive)
  const getLevelColor = (level) => {
    if (!level) return "bg-gray-100 text-gray-700";
    const levelKey = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
    return levelColors[levelKey] || "bg-gray-100 text-gray-700";
  };

  const translatedLevel = translateLevel(level);
  const colorClass = getLevelColor(level);

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass} ${className}`}
    >
      {translatedLevel}
    </span>
  );
}

