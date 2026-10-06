import React from 'react';

interface WatermarkGlyphProps {
  glyph: 'π' | '√' | 'Σ' | '∞' | 'x²' | '∫' | 'Δ' | 'θ';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const WatermarkGlyph: React.FC<WatermarkGlyphProps> = ({
  glyph,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-4xl -top-2 -right-2',
    md: 'text-6xl -top-3 -right-3',
    lg: 'text-8xl -top-4 -right-4',
    xl: 'text-9xl -top-6 -right-6',
  };

  return (
    <span
      className={`absolute select-none pointer-events-none font-serif font-bold text-[#1D4ED8]/[0.05] dark:text-white/[0.04] transition-opacity duration-300 ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
};
