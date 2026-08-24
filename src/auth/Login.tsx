import React, { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface LoginProps {
  onNavigateToSignUp: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onNavigateToSignUp,
}) => {
  const [role, setRole] = useState<'customer' | 'organizer'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email Address is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setError('');
    alert(`Logged in successfully as ${role}: ${email}! 🚀`);
  };

  return (
    <div className="bg-blue-pattern min-h-screen flex items-center justify-center p-6 relative">
      <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full max-w-[480px] py-9 px-8 flex flex-col items-center text-center z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logo */}
        <div className="font-heading font-extrabold text-[26px] text-brand-blue leading-none mb-2">
          TicketHive
        </div>
        
        {/* Title */}
        <h2 className="font-heading font-bold text-[28px] text-ink-black mb-1.5 leading-tight">
          Welcome back!
        </h2>
        
        {/* Subtitle */}
        <p className="font-body text-[14px] text-ink-gray-70 mb-6 leading-relaxed">
          Log in to grab tickets before they sell out.
        </p>

        {/* Segmented Control / Toggle (Customer vs. Organizer) */}
        <div className="w-full bg-brand-blue-light border-3 border-ink-black rounded-full p-[3px] flex items-center gap-1 mb-6">
          <button
            type="button"
            onClick={() => { setRole('customer'); setError(''); }}
            className={`flex-1 py-2 text-center rounded-full font-body text-sm cursor-pointer select-none transition-all duration-150 ${
              role === 'customer'
                ? 'bg-brand-blue text-brand-white font-bold shadow-[2px_2px_0px_0px_#0A0A0F]'
                : 'text-ink-black font-semibold hover:bg-white/40'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => { setRole('organizer'); setError(''); }}
            className={`flex-1 py-2 text-center rounded-full font-body text-sm cursor-pointer select-none transition-all duration-150 ${
              role === 'organizer'
                ? 'bg-brand-blue text-brand-white font-bold shadow-[2px_2px_0px_0px_#0A0A0F]'
                : 'text-ink-black font-semibold hover:bg-white/40'
            }`}
          >
            Organizer
          </button>
        </div>

        {/* Form */}
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="•••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />

          <Button type="submit" variant="primary" className="mt-2 w-full">
            Log In
          </Button>
        </form>

        {/* Footer link */}
        <p className="font-body text-sm font-medium text-ink-gray-70 mt-5">
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
