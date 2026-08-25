import React from 'react';
import { useAuth } from './AuthContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(); // Triggers the OIDC login redirect to Asgardeo
  };

  return (
    <div className="bg-admin-pattern min-h-screen flex items-center justify-center p-6">
      <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full max-w-[480px] py-9 px-8 flex flex-col items-center text-center z-10 animate-in fade-in zoom-in-95 duration-200">
        <Badge variant="black" uppercase={true}>
          Admin Portal
        </Badge>

        <div className="flex items-center gap-1.5 mt-4 mb-2">
          <span className="font-heading font-extrabold text-[26px] text-brand-blue leading-none">
            TicketHive
          </span>
        </div>

        <h2 className="font-heading font-bold text-[28px] text-ink-black mb-4 leading-tight">
          Administrator Access
        </h2>

        <p className="font-body text-[14px] text-ink-gray-70 mb-6 leading-relaxed">
          Log in securely via the identity platform to access the admin console and manage organizers.
        </p>

        <form className="w-full" onSubmit={handleSubmit}>
          <Button type="submit" variant="black" className="w-full py-3">
            Proceed to Secure Login
          </Button>
        </form>

        <p className="font-body text-[13px] font-medium text-ink-gray-70 mt-6">
          All login attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
};
