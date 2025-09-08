import React from 'react';
import { Loader } from 'lucide-react';
import '../css/LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const className = fullScreen ? 'loading-spinner fullscreen' : 'loading-spinner';
  
  return (
    <div className={className}>
      <div className="spinner-content">
        <Loader className="spinner-icon" size={32} />
        <p className="spinner-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
