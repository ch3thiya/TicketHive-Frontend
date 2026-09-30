import React, { useState } from 'react';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthContext';
import { AlignJustify, X } from 'lucide-react';

interface NavbarProps {
  onSignUpClick: () => void;
  onLoginClick: () => void;
  onLogoClick: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCategoryClick?: (category: string) => void;
  onValidateClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSignUpClick,
  onLoginClick,
  onLogoClick,
  searchQuery = '',
  onSearchChange,
  onCategoryClick,
  onValidateClick,
}) => {
  const { isAuthenticated, logout, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
            className="font-heading font-extrabold text-xl sm:text-[24px] text-brand-blue no-underline flex items-center gap-2 select-none hover:opacity-90 transition-opacity"
          >
            <span>🎟️ TicketHive</span>
          </a>
          
          <div className="flex items-center gap-6 max-md:hidden">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onCategoryClick?.('Concerts');
              }}
              className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors select-none"
            >
              Concerts
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onCategoryClick?.('Movies');
              }}
              className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors select-none"
            >
              Movies
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onCategoryClick?.('Sports');
              }}
              className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors select-none"
            >
              Sports
            </a>
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-[480px] min-w-[120px] relative hidden md:block">
          <input
            type="text"
            placeholder="Search events, movies, teams..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-[#F9F9FC] border-[2.5px] border-ink-black rounded-full py-2 px-5 font-body text-[14px] text-ink-black outline-none placeholder-ink-gray-70 focus:border-brand-blue transition-colors"
          />
        </div>

        {/* Right Section: Auth buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
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
                <>
                  <button
                    onClick={() => {
                      window.history.pushState({}, '', '/organizer-dashboard');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="font-body font-bold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors cursor-pointer mr-2 select-none"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onValidateClick?.();
                    }}
                    className="font-body font-bold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors cursor-pointer mr-2 select-none flex items-center gap-1.5"
                  >
                    <span>Validate Tickets</span>
                  </button>
                </>
              )}

              {role !== 'admin' && role !== 'organizer' && (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/my-tickets');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="font-body font-bold text-[14px] text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors cursor-pointer mr-2 select-none flex items-center gap-1.5"
                >
                  <span>My Tickets</span>
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
              
              <div className="hidden sm:block">
                <Button
                  variant="primary"
                  size="M"
                  shadow="S"
                  onClick={onSignUpClick}
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Hamburger Menu Toggle (Mobile) */}
        <div className="md:hidden flex items-center shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 border-2 border-ink-black rounded-full flex items-center justify-center text-ink-black bg-brand-white shadow-[2px_2px_0px_0px_#0A0A0F] active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <AlignJustify size={20} strokeWidth={2.5} />}
          </button>
        </div>
        
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[80px] left-0 w-full bg-brand-white border-b-3 border-ink-black shadow-brutal-m flex flex-col p-6 gap-6 animate-in slide-in-from-top-2 duration-200 z-40">
          
          {/* Mobile Search */}
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search events, movies..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full bg-[#F9F9FC] border-2 border-ink-black rounded-full py-2.5 px-5 font-body text-[14px] text-ink-black outline-none placeholder-ink-gray-70 focus:border-brand-blue transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-4">
            <h3 className="font-heading font-bold text-xs text-ink-gray-70 uppercase tracking-widest">Categories</h3>
            <div className="flex flex-col gap-3">
              {['Concerts', 'Movies', 'Sports'].map(cat => (
                <a
                  key={cat}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onCategoryClick?.(cat);
                    closeMobileMenu();
                  }}
                  className="font-body font-semibold text-base text-ink-black hover:text-brand-blue transition-colors"
                >
                  {cat}
                </a>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="w-full h-px bg-ink-gray-30"></div>

          {/* Mobile Auth Actions */}
          <div className="flex flex-col gap-4">
            {isAuthenticated ? (
              <>
                <h3 className="font-heading font-bold text-xs text-ink-gray-70 uppercase tracking-widest">Account</h3>
                <div className="flex flex-col gap-3">
                  {role === 'admin' && (
                    <button
                      onClick={() => {
                        window.history.pushState({}, '', '/admin-dashboard');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        closeMobileMenu();
                      }}
                      className="font-body font-semibold text-base text-ink-black text-left hover:text-brand-blue"
                    >
                      Dashboard
                    </button>
                  )}

                  {role === 'organizer' && (
                    <>
                      <button
                        onClick={() => {
                          window.history.pushState({}, '', '/organizer-dashboard');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                          closeMobileMenu();
                        }}
                        className="font-body font-semibold text-base text-ink-black text-left hover:text-brand-blue"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          onValidateClick?.();
                          closeMobileMenu();
                        }}
                        className="font-body font-semibold text-base text-ink-black text-left hover:text-brand-blue"
                      >
                        Validate Tickets
                      </button>
                    </>
                  )}

                  {role !== 'admin' && role !== 'organizer' && (
                    <button
                      onClick={() => {
                        window.history.pushState({}, '', '/my-tickets');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        closeMobileMenu();
                      }}
                      className="font-body font-semibold text-base text-ink-black text-left hover:text-brand-blue"
                    >
                      My Tickets
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="font-body font-bold text-base text-[#FF3B3B] text-left mt-2"
                  >
                    Log Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  size="L"
                  shadow="S"
                  onClick={() => {
                    onSignUpClick();
                    closeMobileMenu();
                  }}
                  className="w-full justify-center"
                >
                  Sign Up
                </Button>
                <button
                  onClick={() => {
                    onLoginClick();
                    closeMobileMenu();
                  }}
                  className="font-body font-semibold text-base text-ink-black tracking-[0.2px] hover:text-brand-blue transition-colors cursor-pointer py-3 border-2 border-transparent"
                >
                  Log In
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </nav>
  );
};
