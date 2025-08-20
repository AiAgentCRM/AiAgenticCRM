import React from 'react';
import useToast from '../hooks/useToast';

const ToastDemo = () => {
  const { showSuccess, showError, showWarning, showInfo, showToast, removeAll } = useToast();

  const handleShowSuccess = () => {
    showSuccess('Operation completed successfully!', { duration: 3000 });
  };

  const handleShowError = () => {
    showError('Something went wrong! Please try again.', { duration: 5000 });
  };

  const handleShowWarning = () => {
    showWarning('Please check your input before proceeding.', { duration: 4000 });
  };

  const handleShowInfo = () => {
    showInfo('Here is some useful information for you.', { duration: 3000 });
  };

  const handleShowCustom = () => {
    showToast('This is a custom toast message!', {
      type: 'info',
      duration: 6000,
      position: 'bottom-right'
    });
  };

  const handleShowPersistent = () => {
    showToast('This toast will not auto-dismiss!', {
      type: 'warning',
      duration: 0, // 0 means no auto-dismiss
      position: 'top-center'
    });
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h2>Toast Notification Demo</h2>
          <p className="text-muted">Click the buttons below to see different types of toast notifications.</p>
          
          <div className="d-grid gap-2 d-md-block">
            <button 
              className="btn btn-success me-2 mb-2" 
              onClick={handleShowSuccess}
            >
              Show Success Toast
            </button>
            
            <button 
              className="btn btn-danger me-2 mb-2" 
              onClick={handleShowError}
            >
              Show Error Toast
            </button>
            
            <button 
              className="btn btn-warning me-2 mb-2" 
              onClick={handleShowWarning}
            >
              Show Warning Toast
            </button>
            
            <button 
              className="btn btn-info me-2 mb-2" 
              onClick={handleShowInfo}
            >
              Show Info Toast
            </button>
            
            <button 
              className="btn btn-primary me-2 mb-2" 
              onClick={handleShowCustom}
            >
              Show Custom Toast
            </button>
            
            <button 
              className="btn btn-secondary me-2 mb-2" 
              onClick={handleShowPersistent}
            >
              Show Persistent Toast
            </button>
            
            <button 
              className="btn btn-outline-danger" 
              onClick={removeAll}
            >
              Remove All Toasts
            </button>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <h3>Usage Examples</h3>
          <div className="card">
            <div className="card-body">
              <h5>Using the useToast hook:</h5>
              <pre className="bg-light p-3 rounded">
{`import useToast from '../hooks/useToast';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const handleSuccess = () => {
    showSuccess('Operation completed!');
  };
  
  const handleError = () => {
    showError('Something went wrong!');
  };
};`}
              </pre>
              
              <h5 className="mt-3">Using global methods:</h5>
              <pre className="bg-light p-3 rounded">
{`// Show success toast
window.showSuccessToast('Operation completed!');

// Show error toast with custom duration
window.showErrorToast('Error occurred!', { duration: 10000 });

// Show custom toast
window.showToast('Custom message', {
  type: 'info',
  duration: 5000,
  position: 'bottom-right'
});`}
              </pre>
              
              <h5 className="mt-3">Toast Options:</h5>
              <ul>
                <li><strong>type:</strong> 'success', 'error', 'warning', 'info'</li>
                <li><strong>duration:</strong> Time in milliseconds (0 for persistent)</li>
                <li><strong>position:</strong> 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'</li>
                <li><strong>onClose:</strong> Callback function when toast is closed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastDemo;
