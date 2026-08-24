import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'active' | 'success' | 'error' | 'warning' | 'yellow' | 'black';
  uppercase?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  uppercase = false,
  children,
  className = '',
  ...props
}) => {
  // Variant styles mapped to Tailwind classes
  const variantClasses = {
    default: 'bg-brand-white text-ink-black',
    active: 'bg-brand-blue text-brand-white',
    success: 'bg-[#E5F9F0] text-[#00854E]',
    error: 'bg-[#FFEBEB] text-[#D32F2F]',
    warning: 'bg-[#FFF7E5] text-[#B27A00]',
    yellow: 'bg-surface-yellow text-ink-black',
    black: 'bg-ink-black text-brand-white',
  }[variant];

  // Font typography styling based on uppercase
  const typographyClasses = uppercase
    ? 'text-[12px] font-bold tracking-[0.4px] uppercase'
    : 'text-[14px] font-semibold tracking-normal';

  const baseClasses = 'inline-flex items-center justify-center rounded-full border-[2.5px] border-ink-black py-1.5 px-3.5 font-body whitespace-nowrap select-none';

  return (
    <span
      className={`${baseClasses} ${variantClasses} ${typographyClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
