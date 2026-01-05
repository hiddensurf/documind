import React, { useEffect } from 'react';

export default function ConfirmModal({ open, title = 'Confirm', description = '', confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel, isProcessing = false }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && open) onCancel && onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm hover:brightness-95"
            disabled={isProcessing}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:brightness-95 disabled:opacity-60"
            disabled={isProcessing}
          >
            {isProcessing ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
