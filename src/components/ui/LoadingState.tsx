import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading maths resources...',
  size = 'md',
}) => {
  const spinnerSizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
      <div
        className={`${spinnerSizes[size]} rounded-full border-[#1D4ED8] border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="text-xs md:text-sm text-[#64748B] font-medium">{message}</p>}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-12"></div>
      </div>
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
      <div className="h-14 bg-slate-100 rounded mb-3"></div>
      <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
    </div>
  );
};
