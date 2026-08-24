import { useState, useEffect } from 'react';
import { Home } from './common/Home';
import { Login } from './auth/Login';
import { Register } from './auth/Register';
import { AdminLogin } from './auth/AdminLogin';
import { Navbar } from './navigation/Navbar';
import { Footer } from './navigation/Footer';
import { SignUpPopUp } from './popUps/SignUpPopUp';
import { ArrowLeft } from 'lucide-react';
import './App.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const getRegisterInitialRole = (): 'customer' | 'organizer' => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    return role === 'organizer' ? 'organizer' : 'customer';
  };

  const isAuthRoute =
    currentPath === '/login' ||
    currentPath.startsWith('/register') ||
    currentPath === '/admin-login';

  const renderContent = () => {
    if (currentPath === '/login') {
      return (
        <Login
          onNavigateToSignUp={() => navigateTo('/register?role=customer')}
        />
      );
    }

    if (currentPath.startsWith('/register')) {
      const initialRole = getRegisterInitialRole();
      return (
        <Register
          initialRole={initialRole}
          onNavigateToLogin={() => navigateTo('/login')}
          onNavigateToHome={() => navigateTo('/')}
        />
      );
    }

    if (currentPath === '/admin-login') {
      return <AdminLogin />;
    }

    // Default route represents Home landing page
    return <Home />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-white">
      {/* Back button for auth pages (no header, no footer) */}
      {isAuthRoute && (
        <button
          onClick={() => navigateTo('/')}
          className="fixed top-6 left-6 z-[150] bg-brand-white text-ink-black font-body font-bold text-sm px-4 py-2.5 rounded-full border-3 border-ink-black shadow-brutal-s hover:shadow-[6px_6px_0px_0px_#0A0A0F] active:shadow-[1px_1px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-px active:translate-y-px transition-all duration-150 cursor-pointer flex items-center gap-2 select-none"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Back to Home</span>
        </button>
      )}

      {/* Render Global Navbar only on non-auth routes */}
      {!isAuthRoute && (
        <Navbar
          onLogoClick={() => navigateTo('/')}
          onLoginClick={() => navigateTo('/login')}
          onSignUpClick={() => setIsSignUpOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-grow w-full flex flex-col">
        {renderContent()}
      </main>

      {/* Render Global Footer only on non-auth routes */}
      {!isAuthRoute && (
        <Footer
          onBecomeOrganizerClick={() => navigateTo('/register?role=organizer')}
        />
      )}

      {/* Sign Up selection PopUp modal */}
      <SignUpPopUp
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSelect={(role) => {
          setIsSignUpOpen(false);
          navigateTo(`/register?role=${role}`);
        }}
      />
    </div>
  );
}

export default App;
