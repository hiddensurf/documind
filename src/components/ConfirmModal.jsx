import React from 'react';

const ConfirmModal = ({ open, title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', loading = false, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-light-bg dark:bg-dark-bg rounded-xl shadow-elevated border border-light-border dark:border-dark-border max-w-lg w-full p-6">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</div>
        <div className="text-sm text-light-textSecondary dark:text-dark-textSecondary mb-4">{message}</div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-light-hover dark:bg-dark-hover hover:bg-light-border dark:hover:bg-dark-border text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
