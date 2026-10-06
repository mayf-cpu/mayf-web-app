import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Electric Scholar design tokens
  const baseStyles =
    'inline-flex items-center justify-center font-heading font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] whitespace-nowrap cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 h-8 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2.5 h-11 md:h-10 rounded-lg gap-2',
    lg: 'text-base px-6 py-3 h-12 md:h-12 rounded-lg gap-2.5 shadow-sm',
  };

  const variantStyles = {
    // Primary: Solid #1D4ED8 background with pure white text, bold Plus Jakarta Sans
    primary:
      'bg-[#1D4ED8] hover:bg-[#1E40AF] active:bg-[#1E3A8A] text-white shadow-sm focus-visible:ring-[#1D4ED8]',
    // Secondary: #F1F5F9 background, #1D4ED8 text, transitioning to #E2E8F0 on hover
    secondary:
      'bg-[#F1F5F9] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] text-[#1D4ED8] focus-visible:ring-[#1D4ED8]',
    // Accent: Vibrant gradient #FF6B4A to #F97316 with crisp white text
    accent:
      'bg-gradient-to-r from-[#FF6B4A] to-[#F97316] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-sm focus-visible:ring-[#FF6B4A]',
    // Outline: 1px border with neutral slate
    outline:
      'border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#1E293B] hover:bg-[#F8FAFC] focus-visible:ring-[#1D4ED8]',
    // Ghost: Transparent with hover tint
    ghost:
      'bg-transparent hover:bg-[#EFF6FF] text-[#1D4ED8] active:bg-[#DBEAFE] focus-visible:ring-[#1D4ED8]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
