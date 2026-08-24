import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'error' | 'black';
  size?: 'M' | 'L';
  shadow?: 'M' | 'S' | 'none';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'L',
  shadow = 'M',
  children,
  className = '',
  ...props
}) => {
  // Variant styles mapped to Tailwind classes
  const variantClasses = {
    primary: 'bg-brand-blue text-brand-white hover:bg-[#1a1a5b]',
    secondary: 'bg-surface-yellow text-ink-black hover:bg-[#fce31c]',
    outline: 'bg-brand-white text-ink-black hover:bg-brand-blue-light',
    error: 'bg-state-error text-brand-white hover:bg-[#e02f2f]',
    black: 'bg-ink-black text-brand-white hover:bg-[#1c1c24]',
  }[variant];

  // Size padding
  const sizeClasses = size === 'L' 
    ? 'py-4 px-8' 
    : 'py-[12px] px-[22px]';

  // Shadows and active/hover interactions matching neo-brutalist spec
  let shadowClasses = '';
  if (shadow === 'M') {
    shadowClasses = 'shadow-brutal-m hover:shadow-[8px_8px_0px_0px_#0A0A0F] active:shadow-[2px_2px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[4px] active:translate-y-[4px]';
  } else if (shadow === 'S') {
    shadowClasses = 'shadow-brutal-s hover:shadow-[6px_6px_0px_0px_#0A0A0F] active:shadow-[1px_1px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px]';
  } else {
    shadowClasses = 'shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-0 active:translate-x-0';
  }

  const baseClasses = 'inline-flex items-center justify-center font-body font-bold text-base tracking-[0.2px] rounded-full border-3 border-ink-black cursor-pointer select-none text-center align-middle transition-all duration-150 ease-in-out focus-visible:outline-3 focus-visible:outline-brand-blue focus-visible:outline-offset-4 disabled:bg-ink-gray-30 disabled:text-ink-gray-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${shadowClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
