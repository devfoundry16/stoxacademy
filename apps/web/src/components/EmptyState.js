"use client";

export function EmptyState({ 
  icon: Icon,
  title = "No data found", 
  description,
  actionLabel,
  onAction 
}) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mb-4">
          <Icon className="w-16 h-16 text-gray-400 mx-auto" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

