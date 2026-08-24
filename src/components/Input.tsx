import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: React.ReactNode;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'checkbox';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);

  // Custom checkbox layout
  if (type === 'checkbox') {
    const { ...checkboxProps } = props as React.InputHTMLAttributes<HTMLInputElement>;
    return (
      <div className={`flex flex-col ${className}`}>
        <label className="group inline-flex items-center gap-3 cursor-pointer select-none font-body text-sm font-medium text-ink-black leading-relaxed">
          <input
            type="checkbox"
            className="peer absolute opacity-0 cursor-pointer h-0 w-0"
            id={inputId}
            {...checkboxProps}
          />
          <span className="h-6 w-6 bg-brand-white border-2 border-ink-black rounded-8 flex items-center justify-center transition-all duration-150 ease-in-out shrink-0 peer-checked:bg-brand-blue peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand-blue peer-focus-visible:outline-offset-2 group-hover:-translate-x-px group-hover:-translate-y-px group-hover:shadow-[2px_2px_0px_0px_#0A0A0F]">
            <svg
              className="w-3.5 h-3.5 stroke-brand-white stroke-[4] fill-none hidden peer-checked:block"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span>{label}</span>
        </label>
        {error && (
          <span className="font-body text-[13px] font-medium text-state-error mt-1.5 ml-9 text-left">
            {error}
          </span>
        )}
      </div>
    );
  }

  // Textarea layout
  if (type === 'textarea') {
    const textareaProps = props as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    return (
      <div className={`flex flex-col gap-2 w-full text-left ${className}`}>
        <label htmlFor={inputId} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
          {label}
        </label>
        <textarea
          id={inputId}
          className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 px-4 w-full min-h-[120px] resize-vertical outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s"
          {...textareaProps}
        />
        {error && (
          <span className="font-body text-[13px] font-medium text-state-error mt-1">
            {error}
          </span>
        )}
      </div>
    );
  }

  // Standard input layout (text, email, password, tel, etc.)
  const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>;
  return (
    <div className={`flex flex-col gap-2 w-full text-left ${className}`}>
      <label htmlFor={inputId} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
        {label}
      </label>
      
      {type === 'password' ? (
        <div className="relative w-full">
          <input
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 pl-4 pr-12 w-full outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s"
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-gray-70 hover:text-ink-black transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
          >
            {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
          </button>
        </div>
      ) : (
        <input
          id={inputId}
          type={type}
          className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 px-4 w-full outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s"
          {...inputProps}
        />
      )}

      {error && (
        <span className="font-body text-[13px] font-medium text-state-error mt-1">
          {error}
        </span>
      )}
    </div>
  );
};
