import React, { useState } from 'react';
import { Button } from '../components/Button';

interface FooterProps {
  onBecomeOrganizerClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onBecomeOrganizerClick,
}) => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    alert(`Subscribed successfully with ${email}! ✉️`);
    setEmail('');
  };

  return (
    <footer className="w-full bg-brand-blue text-brand-white border-t-3 border-ink-black z-10 shrink-0">
      
      {/* 8xl Max Width Container */}
      <div className="max-w-8xl mx-auto px-6 py-12 flex flex-col gap-10">
        
        {/* Row 1: Newsletter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-brand-white/20">
          <div>
            <h3 className="font-heading font-bold text-[24px] text-brand-white mb-1 leading-tight">
              Never miss a show
            </h3>
            <p className="font-body text-[14px] text-brand-white/80">
              Get weekly drops on new events near you.
            </p>
          </div>
          
          <form onSubmit={handleSubscribe} className="flex items-center gap-3 w-full md:w-auto max-w-[460px]">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-brand-white text-ink-black font-body text-[14px] rounded-full py-3.5 px-6 border-3 border-ink-black outline-none placeholder-ink-gray-70 flex-grow"
            />
            <Button
              type="submit"
              variant="secondary"
              size="M"
              shadow="S"
              className="shrink-0"
            >
              Subscribe
            </Button>
          </form>
        </div>

        {/* Row 2: Grid Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-4">
          
          {/* Logo Column */}
          <div className="flex flex-col gap-4">
            <span className="font-heading font-extrabold text-[24px] leading-none">
              TicketHive
            </span>
            <p className="font-body text-[14px] text-brand-white/80 leading-relaxed max-w-[220px]">
              The easiest way to discover live events and book tickets you can trust.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="flex flex-col gap-3">
            <span className="font-body font-bold text-[12px] tracking-[0.4px] uppercase text-brand-white/70">
              Company
            </span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('About Us clicked'); }} className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors">
              About Us
            </a>
          </div>

          {/* Links Column 2 */}
          <div className="flex flex-col gap-3">
            <span className="font-body font-bold text-[12px] tracking-[0.4px] uppercase text-brand-white/70">
              Support
            </span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Contact Us clicked'); }} className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors">
              Contact Us
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Refund Policy clicked'); }} className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors">
              Refund Policy
            </a>
          </div>

          {/* Links Column 3 */}
          <div className="flex flex-col gap-3">
            <span className="font-body font-bold text-[12px] tracking-[0.4px] uppercase text-brand-white/70">
              For Organizers
            </span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onBecomeOrganizerClick) onBecomeOrganizerClick();
              }}
              className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors"
            >
              Become an Organizer
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Organizer Dashboard clicked'); }} className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors">
              Organizer Dashboard
            </a>
          </div>

          {/* Links Column 4 */}
          <div className="flex flex-col gap-3">
            <span className="font-body font-bold text-[12px] tracking-[0.4px] uppercase text-brand-white/70">
              Legal
            </span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Terms of Service clicked'); }} className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors">
              Terms of Service
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Privacy Policy clicked'); }} className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors">
              Privacy Policy
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Cookie Policy clicked'); }} className="font-body font-normal text-[14px] hover:underline hover:text-brand-blue-light transition-colors">
              Cookie Policy
            </a>
          </div>

        </div>

        {/* Row 3: Bottom Credits */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-brand-white/20 font-body text-[13px] text-brand-white/60">
          <span>
            © 2026 TicketHive, Inc. All rights reserved.
          </span>
          <div className="flex gap-6">
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Terms clicked'); }} className="hover:underline hover:text-brand-white transition-colors">Terms</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Privacy clicked'); }} className="hover:underline hover:text-brand-white transition-colors">Privacy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Sitemap clicked'); }} className="hover:underline hover:text-brand-white transition-colors">Sitemap</a>
          </div>
        </div>

      </div>

    </footer>
  );
};
