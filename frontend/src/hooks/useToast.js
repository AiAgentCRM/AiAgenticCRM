import { useCallback } from 'react';

const useToast = () => {
  const showToast = useCallback((message, options = {}) => {
    if (typeof window !== 'undefined' && window.showToast) {
      return window.showToast({ message, ...options });
    }
    // Fallback to console if toast system is not available
    console.log(`[Toast] ${message}`, options);
    return null;
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    return showToast(message, { type: 'success', ...options });
  }, [showToast]);

  const showError = useCallback((message, options = {}) => {
    return showToast(message, { type: 'error', ...options });
  }, [showToast]);

  const showWarning = useCallback((message, options = {}) => {
    return showToast(message, { type: 'warning', ...options });
  }, [showToast]);

  const showInfo = useCallback((message, options = {}) => {
    return showToast(message, { type: 'info', ...options });
  }, [showToast]);

  const removeAll = useCallback(() => {
    if (typeof window !== 'undefined' && window.removeAllToasts) {
      window.removeAllToasts();
    }
  }, []);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeAll
  };
};

export default useToast;
