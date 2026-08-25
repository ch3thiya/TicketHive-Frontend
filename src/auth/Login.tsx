import React from 'react';
import { useAuth } from './AuthContext';
import { Button } from '../components/Button';

interface LoginProps {
  onNavigateToSignUp: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onNavigateToSignUp,
}) => {
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(); // Directs the user to Asgardeo for secure login
  };

  return (
    <div className="bg-blue-pattern min-h-screen flex items-center justify-center p-6 relative">
      <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full max-w-[480px] py-9 px-8 flex flex-col items-center text-center z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logo */}
        <div className="font-heading font-extrabold text-[26px] text-brand-blue leading-none mb-2">
          TicketHive
        </div>
        
        {/* Title */}
        <h2 className="font-heading font-bold text-[28px] text-ink-black mb-2 leading-tight">
          Welcome back!
        </h2>
        
        {/* Subtitle */}
        <p className="font-body text-[14px] text-ink-gray-70 mb-8 leading-relaxed">
          Log in securely via the identity platform to grab tickets before they sell out.
        </p>

        {/* Form */}
        <form className="w-full" onSubmit={handleSubmit}>
          <Button type="submit" variant="primary" className="w-full py-3">
            Proceed to Secure Login
          </Button>
        </form>

        {/* Footer link */}
        <p className="font-body text-sm font-medium text-ink-gray-70 mt-8">
          Don't have an account?{' '}
          <span
            className="text-ink-black font-semibold underline cursor-pointer hover:text-brand-blue transition-colors duration-150"
            onClick={onNavigateToSignUp}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};
