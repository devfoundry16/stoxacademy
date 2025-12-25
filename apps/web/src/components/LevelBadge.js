"use client";

const levelColors = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-blue-100 text-blue-700",
  Advanced: "bg-purple-100 text-purple-700",
};

export function LevelBadge({ level, className = "" }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        levelColors[level] || "bg-gray-100 text-gray-700"
      } ${className}`}
    >
      {level}
    </span>
  );
}

