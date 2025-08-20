import React, { useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContainer = ({ position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toastData) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      ...toastData,
      onClose: () => removeToast(id)
    };

    setToasts(prevToasts => {
      const updatedToasts = [...prevToasts, newToast];
      // Keep only the latest maxToasts
      return updatedToasts.slice(-maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods globally for easy access
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showToast = addToast;
      window.showSuccessToast = (message, options = {}) => 
        addToast({ message, type: 'success', ...options });
      window.showErrorToast = (message, options = {}) => 
        addToast({ message, type: 'error', ...options });
      window.showWarningToast = (message, options = {}) => 
        addToast({ message, type: 'warning', ...options });
      window.showInfoToast = (message, options = {}) => 
        addToast({ message, type: 'info', ...options });
      window.removeAllToasts = removeAllToasts;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showToast;
        delete window.showSuccessToast;
        delete window.showErrorToast;
        delete window.showWarningToast;
        delete window.showInfoToast;
        delete window.removeAllToasts;
      }
    };
  }, [addToast, removeAllToasts]);

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          style={{
            zIndex: 9999 + index,
            marginTop: index > 0 ? `${index * 10}px` : '0'
          }}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
