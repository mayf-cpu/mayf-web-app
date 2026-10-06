import React from 'react';
import { Star } from 'lucide-react';

export interface BadgeProps {
  variant?: 'free' | 'pro' | 'cyan' | 'neutral';
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'sm',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] font-bold tracking-wider py-0.5 px-2.5'
      : 'text-xs font-semibold py-1 px-3';

  if (variant === 'pro') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-heading rounded-full bg-gradient-to-r from-[#FF6B4A] to-[#EA580C] text-white shadow-xs select-none ${sizeClasses} ${className}`}
      >
        <Star className="w-2.5 h-2.5 fill-white stroke-none" aria-hidden="true" />
        <span>{children || 'PRO'}</span>
      </span>
    );
  }

  if (variant === 'free') {
    return (
      <span
        className={`inline-flex items-center font-heading rounded-full bg-[#F1F5F9] text-[#475569] uppercase select-none ${sizeClasses} ${className}`}
      >
        {children || 'FREE'}
      </span>
    );
  }

  if (variant === 'cyan') {
    return (
      <span
        className={`inline-flex items-center font-heading rounded-full bg-[#ECFEFF] text-[#0891B2] border border-[#CFFAFE] select-none ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-heading rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] select-none ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
