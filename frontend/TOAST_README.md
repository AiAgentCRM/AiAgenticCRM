# Toast Notification System

A modern, responsive toast notification system for React applications with Bootstrap styling.

## Features

- ✅ Multiple toast types: Success, Error, Warning, Info
- ✅ Customizable positions (top-right, top-left, bottom-right, bottom-left, top-center, bottom-center)
- ✅ Auto-dismiss with configurable duration
- ✅ Manual close button
- ✅ Progress bar animation
- ✅ Responsive design for mobile devices
- ✅ Multiple toasts support with stacking
- ✅ Global methods for easy access
- ✅ Custom hook for React components
- ✅ Smooth animations and transitions

## Installation

The toast system is already integrated into your project. No additional packages are required.

## Quick Start

### 1. Basic Usage

The toast system is automatically available throughout your app. You can use it in any component:

```jsx
import useToast from '../hooks/useToast';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };
  
  const handleError = () => {
    showError('Something went wrong!');
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
};
```

### 2. Global Methods

You can also use the toast system from anywhere in your app using global methods:

```javascript
// Show different types of toasts
window.showSuccessToast('Success message!');
window.showErrorToast('Error message!');
window.showWarningToast('Warning message!');
window.showInfoToast('Info message!');

// Show custom toast
window.showToast('Custom message', {
  type: 'info',
  duration: 5000,
  position: 'bottom-right'
});

// Remove all toasts
window.removeAllToasts();
```

## API Reference

### useToast Hook

The `useToast` hook provides the following methods:

- `showToast(message, options)` - Show a custom toast
- `showSuccess(message, options)` - Show a success toast
- `showError(message, options)` - Show an error toast
- `showWarning(message, options)` - Show a warning toast
- `showInfo(message, options)` - Show an info toast
- `removeAll()` - Remove all active toasts

### Toast Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | 'info' | Toast type: 'success', 'error', 'warning', 'info' |
| `duration` | number | 5000 | Auto-dismiss time in milliseconds (0 for persistent) |
| `position` | string | 'top-right' | Toast position |
| `onClose` | function | - | Callback when toast is closed |

### Available Positions

- `top-right` (default)
- `top-left`
- `bottom-right`
- `bottom-left`
- `top-center`
- `bottom-center`

## Examples

### Success Toast

```jsx
showSuccess('Data saved successfully!');
```

### Error Toast with Custom Duration

```jsx
showError('Failed to save data. Please try again.', { duration: 10000 });
```

### Warning Toast with Custom Position

```jsx
showWarning('Please check your input before proceeding.', { 
  position: 'top-center',
  duration: 4000 
});
```

### Custom Toast

```jsx
showToast('This is a custom message!', {
  type: 'info',
  duration: 3000,
  position: 'bottom-right'
});
```

### Persistent Toast (No Auto-dismiss)

```jsx
showToast('This toast will stay until manually closed', {
  type: 'warning',
  duration: 0
});
```

## Integration with Existing Components

### In TenantDashboard.js

You can now use toasts in your TenantDashboard component:

```jsx
import useToast from '../hooks/useToast';

const TenantDashboard = () => {
  const { showSuccess, showError } = useToast();
  
  const handleSaveSettings = async () => {
    try {
      // Your save logic here
      await saveSettings();
      showSuccess('Settings saved successfully!');
    } catch (error) {
      showError('Failed to save settings: ' + error.message);
    }
  };
  
  // ... rest of your component
};
```

### In API Calls

```jsx
const handleSubmit = async (formData) => {
  try {
    const response = await api.submitForm(formData);
    showSuccess('Form submitted successfully!');
  } catch (error) {
    showError(`Submission failed: ${error.message}`);
  }
};
```

### In Form Validation

```jsx
const validateForm = () => {
  if (!email) {
    showError('Email is required');
    return false;
  }
  
  if (!password) {
    showError('Password is required');
    return false;
  }
  
  showSuccess('Form is valid!');
  return true;
};
```

## Styling

The toast system uses CSS classes that can be customized:

- `.toast-notification` - Main toast container
- `.toast-success` - Success toast styling
- `.toast-error` - Error toast styling
- `.toast-warning` - Warning toast styling
- `.toast-info` - Info toast styling

You can override these styles in your CSS files to match your app's design.

## Mobile Responsiveness

The toast system automatically adapts to mobile devices:

- On screens smaller than 768px, toasts use full width
- Position classes are automatically adjusted for mobile
- Touch-friendly close buttons

## Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## Troubleshooting

### Toasts not showing?

1. Make sure `ToastContainer` is included in your App.js
2. Check that the toast system is properly imported
3. Verify that the component using toasts is mounted

### Toasts overlapping?

1. Adjust the `maxToasts` prop in ToastContainer
2. Use different positions for different types of messages
3. Set appropriate durations to prevent too many toasts at once

### Custom styling not working?

1. Check CSS specificity
2. Ensure your CSS is loaded after the toast CSS
3. Use `!important` if necessary for critical overrides

## Demo Component

Check out `ToastDemo.js` for a complete demonstration of all toast features and usage examples.

## Support

For issues or questions about the toast system, check the component files or refer to this documentation.
