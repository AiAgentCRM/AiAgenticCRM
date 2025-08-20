import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose, 
  position = 'top-right',
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, 300);
  };

  const getToastClass = () => {
    const baseClass = 'toast-notification';
    const typeClass = `toast-${type}`;
    const positionClass = `toast-${position.replace('-', '-')}`;
    const exitClass = isExiting ? 'toast-exiting' : '';
    
    return `${baseClass} ${typeClass} ${positionClass} ${exitClass}`.trim();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={getToastClass()}>
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-message">{message}</div>
        <button 
          className="toast-close" 
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      {duration > 0 && (
        <div className="toast-progress">
          <div 
            className="toast-progress-bar"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
