import { useState, useEffect } from 'react';
import { Home } from './common/Home';
import { EventDetail } from './common/EventDetail';
import { Login } from './auth/Login';
import { Register } from './auth/Register';
import { AdminLogin } from './auth/AdminLogin';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { OrganizerDashboard } from './dashboards/OrganizerDashboard';
import { Navbar } from './navigation/Navbar';
import { Footer } from './navigation/Footer';
import { SignUpPopUp } from './popUps/SignUpPopUp';
import { CheckoutPage } from './pages/CheckoutPage';
import { ArrowLeft } from 'lucide-react';
import './App.css';

import { useAuth } from './auth/AuthContext';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { isAuthenticated, role, login, isLoading } = useAuth();

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Redirect users on successful login based on their role
  useEffect(() => {
    if (!isAuthenticated) return;

    const isCallback = window.location.search.includes('code=') && window.location.search.includes('state=');

    const redirect = (path: string) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    if (role === 'admin') {
      // Redirect to dashboard ONLY on login pages or during callback
      if (currentPath === '/admin-login' || currentPath === '/login' || (currentPath === '/' && isCallback)) {
        redirect('/admin-dashboard');
      }
    } else if (role === 'organizer') {
      // Redirect organizers to their dashboard on login pages or during callback
      if (currentPath === '/login' || (currentPath === '/' && isCallback)) {
        redirect('/organizer-dashboard');
      }
    } else {
      // Send regular customers back to homepage if they are on login screens
      if (currentPath === '/login' || currentPath === '/admin-login') {
        redirect('/');
      }
    }
  }, [isAuthenticated, role, currentPath]);

  const getRegisterInitialRole = (): 'customer' | 'organizer' => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    return role === 'organizer' ? 'organizer' : 'customer';
  };

  const isAuthRoute =
    currentPath === '/login' ||
    currentPath.startsWith('/register') ||
    currentPath === '/admin-login' ||
    currentPath === '/admin-dashboard' ||
    currentPath === '/organizer-dashboard';

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

    if (currentPath === '/admin-dashboard') {
      return <AdminDashboard />;
    }

    if (currentPath === '/organizer-dashboard') {
      return <OrganizerDashboard />;
    }

    if (currentPath.startsWith('/checkout/')) {
      const orderId = currentPath.replace('/checkout/', '').split('?')[0];
      return (
        <CheckoutPage
          orderId={orderId}
          onNavigateHome={() => navigateTo('/')}
        />
      );
    }

    if (currentPath.startsWith('/events/')) {
      const eventId = currentPath.replace('/events/', '').split('?')[0];
      return (
        <EventDetail
          eventId={eventId}
          onNavigateBack={() => navigateTo('/')}
        />
      );
    }

    // Default route represents Home landing page
    return (
      <Home
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onSelectEvent={(eventId) => navigateTo(`/events/${eventId}`)}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-white p-6">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body text-ink-black font-semibold text-sm">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-white">
      {/* Back button for auth pages (no header, no footer), hidden on dashboard consoles */}
      {isAuthRoute && currentPath !== '/admin-dashboard' && currentPath !== '/organizer-dashboard' && (
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
          onLogoClick={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            navigateTo('/');
          }}
          onLoginClick={login}
          onSignUpClick={() => setIsSignUpOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (currentPath !== '/') {
              navigateTo('/');
            }
          }}
          onCategoryClick={(category) => {
            setSelectedCategory(category);
            if (currentPath !== '/') {
              navigateTo('/');
            }
          }}
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
