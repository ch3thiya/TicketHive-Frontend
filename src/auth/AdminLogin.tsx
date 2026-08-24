import React, { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Admin Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setError('');
    alert(`Secure Login attempted for ${email}! 🚀`);
  };

  return (
    <div className="bg-admin-pattern min-h-screen flex items-center justify-center p-6">
      <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full max-w-[480px] py-9 px-8 flex flex-col items-center text-center z-10">
        <Badge variant="black" uppercase={true}>
          Admin Portal
        </Badge>

        <div className="flex items-center gap-1.5 mt-4 mb-2">
          <span className="font-heading font-extrabold text-[26px] text-brand-blue leading-none">
            TicketHive
          </span>
        </div>

        <h2 className="font-heading font-bold text-[28px] text-ink-black mb-7 leading-tight">
          Administrator Login
        </h2>

        <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
          <Input
            label="Admin Email"
            type="email"
            placeholder="admin@tickethive.com"
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

          <Button type="submit" variant="black" className="mt-2">
            Secure Login
          </Button>
        </form>

        <p className="font-body text-[13px] font-medium text-ink-gray-70 mt-4">
          All login attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
};
