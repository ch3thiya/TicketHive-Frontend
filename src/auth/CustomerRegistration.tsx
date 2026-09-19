import React, { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface CustomerRegistrationProps {
  onNavigateToLogin: () => void;
}

export const CustomerRegistration: React.FC<CustomerRegistrationProps> = ({
  onNavigateToLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName) newErrors.fullName = 'Full Name is required';
    if (!email) newErrors.email = 'Email Address is required';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agree) newErrors.agree = 'You must agree to the Terms & Privacy Policy';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert(`Customer account created successfully for ${fullName}! 🎉`);
    }
  };

  return (
    <div className="bg-blue-pattern min-h-screen flex items-center justify-center p-6">
      <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full max-w-[520px] py-9 px-8 flex flex-col items-center text-center z-10">
        <div className="font-heading font-extrabold text-[26px] text-brand-blue leading-none mb-2">
          TicketHive
        </div>
        <h2 className="font-heading font-bold text-[28px] text-ink-black mb-2 leading-tight">
          Create your account
        </h2>
        <p className="font-body text-[15px] text-ink-gray-70 mb-6 leading-relaxed">
          Sign up to start booking tickets for your favorite events.
        </p>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            placeholder="Alex Johnson"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
          />

          <div className="self-start mt-1 mb-2 text-left">
            <Input
              label="I agree to the Terms of Service and Privacy Policy"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree((e.target as HTMLInputElement).checked)}
              error={errors.agree}
              required
            />
          </div>

          <Button type="submit" variant="primary" className="mt-2">
            Create Account
          </Button>
        </form>

        <p className="font-body text-sm font-medium text-ink-gray-70 mt-4">
          Already have an account?{' '}
          <span className="text-ink-black font-semibold underline cursor-pointer hover:text-brand-blue transition-colors duration-150" onClick={onNavigateToLogin}>
            Log In
          </span>
        </p>
      </div>
    </div>
  );
};
