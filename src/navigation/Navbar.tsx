import React from 'react';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthContext';

interface NavbarProps {
  onSignUpClick: () => void;
  onLoginClick: () => void;
  onLogoClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSignUpClick,
  onLoginClick,
  onLogoClick,
}) => {
  const { isAuthenticated, logout, role, fullName } = useAuth();

  return (
    <nav className="w-full bg-brand-white border-b-3 border-ink-black sticky top-0 z-50">
      {/* Restrain content wrapper to 8xl (1440px) */}
      <div className="max-w-8xl mx-auto px-6 h-[80px] flex items-center justify-between gap-4">
        
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-8 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onLogoClick();
            }}
            className="font-heading font-extrabold text-[24px] text-brand-blue no-underline flex items-center gap-2 select-none hover:opacity-90 transition-opacity"
          >
            <span>🎟️ TicketHive</span>
          </a>
          
          <div className="flex items-center gap-6 max-md:hidden">
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Concerts clicked 🎸'); }} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors">
              Concerts
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Movies clicked 🎬'); }} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors">
              Movies
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Sports clicked ⚽'); }} className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors">
              Sports
            </a>
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-[480px] min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search events, movies, teams..."
            className="w-full bg-[#F9F9FC] border-[2.5px] border-ink-black rounded-full py-2 px-5 font-body text-[14px] text-ink-black outline-none placeholder-ink-gray-70 focus:border-brand-blue transition-colors"
          />
        </div>

        {/* Right Section: Auth buttons */}
        <div className="flex items-center gap-4 shrink-0">
          {isAuthenticated ? (
            <>
              {role === 'admin' && (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/admin-dashboard');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="font-body font-bold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors cursor-pointer mr-2 select-none"
                >
                  Dashboard
                </button>
              )}

              {role === 'organizer' && (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/organizer-dashboard');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="font-body font-bold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors cursor-pointer mr-2 select-none"
                >
                  Dashboard
                </button>
              )}
              
              <button
                onClick={logout}
                className="font-body font-bold text-[14px] text-[#FF3B3B] bg-brand-white border-[2.5px] border-ink-black rounded-full px-5 py-2 hover:bg-[#FF3B3B]/5 active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F]"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors cursor-pointer"
              >
                Log In
              </button>
              
              <Button
                variant="primary"
                size="M"
                shadow="S"
                onClick={onSignUpClick}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
        
      </div>
    </nav>
  );
};
