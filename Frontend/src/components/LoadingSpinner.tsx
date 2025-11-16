import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 rounded-full border-2 border-wellness-calm/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-wellness-calm animate-spin"></div>
      </div>
    </div>
  );
};

export const ShimmerCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md shimmer"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md shimmer w-3/4"></div>
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md shimmer w-1/2"></div>
      </div>
    </div>
  );
};