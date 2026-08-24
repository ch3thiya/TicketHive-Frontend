import React, { useState, useEffect } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { RequestSubmitted } from './RequestSubmitted';

interface RegisterProps {
  initialRole: 'customer' | 'organizer';
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

const API_BASE_URL = 'http://localhost:5051';

export const Register: React.FC<RegisterProps> = ({
  initialRole,
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const [role, setRole] = useState<'customer' | 'organizer'>(initialRole);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRole(initialRole);
    setIsSubmitted(false); // Reset submitted state on tab change/redirect
    setApiError(null);
  }, [initialRole]);

  // Common Credential States
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Customer Form State
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});

  // Organizer Form State
  const [orgName, setOrgName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [about, setAbout] = useState('');
  const [organizerErrors, setOrganizerErrors] = useState<Record<string, string>>({});

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName) newErrors.fullName = 'Full Name is required';
    if (!email) newErrors.email = 'Email Address is required';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agree) newErrors.agree = 'You must agree to the Terms & Privacy Policy';

    setCustomerErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // For standard customers, they sign up directly via WSO2 IS OIDC self-registration.
      // So here we notify them to log in via the OIDC login portal.
      alert(`Customer registration is handled securely via WSO2. Click OK to navigate to Login.`);
      onNavigateToLogin();
    }
  };

  const handleOrganizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName) newErrors.fullName = 'Contact name is required';
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!orgName) newErrors.orgName = 'Organization name is required';
    if (!businessEmail) newErrors.businessEmail = 'Business email is required';
    if (!phone) newErrors.phone = 'Phone number is required';
    if (!eventType) newErrors.eventType = 'Event type is required';
    if (!about) newErrors.about = 'Please describe your events';

    setOrganizerErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setApiError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/identity/accounts/register-organizer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            email: businessEmail,
            password,
            organizationName: orgName,
            businessEmail,
            phone,
            eventType,
            about
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsSubmitted(true);
        } else {
          setApiError(data.message || 'Registration failed. Please check your credentials.');
        }
      } catch (err) {
        setApiError('Unable to connect to the authentication service. Please check if the backend is running.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitted) {
    return <RequestSubmitted onBack={onNavigateToHome} />;
  }

  return (
    <div className="bg-blue-pattern min-h-screen flex items-center justify-center p-6">
      
      {/* Container Card with dynamic width depending on selected tab */}
      <div className={`bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full transition-all duration-300 py-9 px-8 flex flex-col items-center z-10 animate-in fade-in zoom-in-95 duration-200 ${
        role === 'customer' ? 'max-w-[520px]' : 'max-w-[640px]'
      }`}>
        
        {role === 'organizer' && (
          <Badge variant="yellow" uppercase={true} className="mb-4">
            Become an Organizer
          </Badge>
        )}

        {/* Title */}
        <h2 className="font-heading font-bold text-[28px] text-ink-black mb-1.5 leading-tight text-center">
          {role === 'customer' ? 'Create your account' : 'Start selling tickets'}
        </h2>
        
        {/* Subtitle */}
        <p className="font-body text-[14px] text-ink-gray-70 mb-4 leading-relaxed text-center max-w-[400px]">
          {role === 'customer' 
            ? 'Sign up to start booking tickets for your favorite events.'
            : 'Tell us a bit about your organization. Our team typically reviews requests within 1–2 business days.'
          }
        </p>

        {apiError && (
          <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm text-center">
            {apiError}
          </div>
        )}

        {/* Conditional Forms */}
        {role === 'customer' ? (
          <form className="w-full flex flex-col gap-4" onSubmit={handleCustomerSubmit}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={customerErrors.fullName}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={customerErrors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={customerErrors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={customerErrors.confirmPassword}
            />

            <div className="self-start mt-1 mb-2 text-left">
              <Input
                label="I agree to the Terms of Service and Privacy Policy"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree((e.target as HTMLInputElement).checked)}
                error={customerErrors.agree}
              />
            </div>

            <Button type="submit" variant="primary" className="mt-2 w-full">
              Create Account
            </Button>
          </form>
        ) : (
          <form className="w-full flex flex-col gap-4" onSubmit={handleOrganizerSubmit}>
            
            <div className="flex gap-4 w-full flex-col sm:flex-row">
              <Input
                label="Contact Name"
                type="text"
                placeholder="Alex Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={organizerErrors.fullName}
                className="flex-1"
              />
              <Input
                label="Business Email"
                type="email"
                placeholder="you@organization.com"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                error={organizerErrors.businessEmail}
                className="flex-1"
              />
            </div>

            <div className="flex gap-4 w-full flex-col sm:flex-row">
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={organizerErrors.password}
                className="flex-1"
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={organizerErrors.confirmPassword}
                className="flex-1"
              />
            </div>

            <div className="flex gap-4 w-full flex-col sm:flex-row">
              <Input
                label="Organization Name"
                type="text"
                placeholder="e.g. Live Nation Presents"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                error={organizerErrors.orgName}
                className="flex-1"
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={organizerErrors.phone}
                className="flex-1"
              />
            </div>

            <Input
              label="Event Type"
              type="text"
              placeholder="Concerts, Movies, Sports..."
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              error={organizerErrors.eventType}
            />

            <Input
              label="Tell us about your events"
              type="textarea"
              placeholder="We host indie music festivals across the west coast..."
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              error={organizerErrors.about}
            />

            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
            </Button>
          </form>
        )}

        <p className="font-body text-sm font-medium text-ink-gray-70 mt-5">
          Already have an account?{' '}
          <span
              className="text-ink-black font-semibold underline cursor-pointer hover:text-brand-blue transition-colors duration-150"
              onClick={onNavigateToLogin}
          >
            Log In
          </span>
        </p>

      </div>
    </div>
  );
};
