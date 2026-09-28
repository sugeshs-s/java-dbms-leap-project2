import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading...', size = 32 }) => {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <Loader2 size={size} className="spinner-icon" />
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
