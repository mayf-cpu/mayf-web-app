import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'We encountered an error loading this mathematics module. Please check your connection and try again.',
  onRetry,
  actionText = 'Retry',
}) => {
  return (
    <div className="bg-[#FFF5F5] border border-[#FED7D7] rounded-lg p-6 max-w-lg mx-auto my-8 text-center">
      <div className="w-12 h-12 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6 text-[#DC2626]" aria-hidden="true" />
      </div>
      <h3 className="font-heading font-bold text-base md:text-lg text-[#991B1B] mb-2">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-[#7F1D1D] mb-5 leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} className="inline-flex gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </Button>
      )}
    </div>
  );
};
