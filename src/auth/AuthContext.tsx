/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuth as useOidcAuth, AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';

// Config for WSO2 Identity Server (Local Dev default)
const oidcConfig = {
  authority: 'https://api.asgardeo.io/t/orgvx6qo/oauth2/token',
  client_id: import.meta.env.VITE_ASGARDEO_CLIENT_ID || 'YOUR_ASGARDEO_SPA_CLIENT_ID',
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email groups',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  
  metadata: {
    issuer: 'https://api.asgardeo.io/t/orgvx6qo/oauth2/token',
    authorization_endpoint: 'https://api.asgardeo.io/t/orgvx6qo/oauth2/authorize',
    token_endpoint: 'https://api.asgardeo.io/t/orgvx6qo/oauth2/token',
    userinfo_endpoint: 'https://api.asgardeo.io/t/orgvx6qo/oauth2/userinfo',
    jwks_uri: 'https://api.asgardeo.io/t/orgvx6qo/oauth2/jwks',
    end_session_endpoint: 'https://api.asgardeo.io/t/orgvx6qo/oidc/logout'
  }
};

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  email: string | null;
  fullName: string | null;
  role: 'customer' | 'organizer' | 'admin' | null;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { useState, useCallback } from 'react';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const oidc = useOidcAuth();
  const [dbUser, setDbUser] = useState<{ role?: string; approvalStatus?: string } | null>(null);

  const accessToken = oidc.user?.access_token || null;
  const profile = (oidc.user?.profile as Record<string, unknown>) || {};

  // Log token claims to help debug in browser developer console
  if (oidc.isAuthenticated) {
    console.log("Token Claims Profile:", profile);
  }

  // Extract Email
  const email = (profile.email as string) || (profile.sub as string) || null;
  
  // Extract Name
  const fullName = (profile.name as string) || (profile.given_name as string) || null;

  // Extract custom WSO2 claim 'isapproved' (fallback to standard profile paths)
  let tokenApprovalStatus: 'pending' | 'approved' | 'rejected' | null = null;
  const isApprovedClaim = profile['isapproved'] || profile['urn:scim:schemas:extension:tickethive:2.0:User:isapproved'];
  if (isApprovedClaim) {
    tokenApprovalStatus = (isApprovedClaim.toString().toLowerCase() as 'pending' | 'approved' | 'rejected') || null;
  }

  // Extract Roles from token
  let tokenRole: 'customer' | 'organizer' | 'admin' | null = null;
  const rolesClaim = profile['roles'] || profile['groups'] || [];
  const roles = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];

  if (roles.includes('Admin') || roles.includes('admin')) {
    tokenRole = 'admin';
  } else if (roles.includes('Organizer') || roles.includes('organizer')) {
    tokenRole = 'organizer';
  } else if (oidc.isAuthenticated) {
    tokenRole = 'customer'; // Default role for authenticated users
  }

  // Use database values as source of truth, falling back to OIDC token values
  const role = dbUser ? (dbUser.role?.toLowerCase() as 'customer' | 'organizer' | 'admin' | null) : tokenRole;
  const approvalStatus = dbUser ? (dbUser.approvalStatus?.toLowerCase() as 'pending' | 'approved' | 'rejected' | null) : tokenApprovalStatus;

  const login = async () => {
    await oidc.signinRedirect();
  };

  const logout = async () => {
    await oidc.signoutRedirect();
  };

  // Helper method to make authenticated requests to API services
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    return fetch(url, {
      ...options,
      headers
    });
  }, [accessToken]);

  // Synchronize account with local PostgreSQL database upon successful login
  useEffect(() => {
    const syncAccount = async () => {
      if (oidc.isAuthenticated && accessToken) {
        try {
          console.log("Syncing authenticated user account with backend database...");
          const response = await apiFetch('http://localhost:5051/api/identity/accounts/sync', {
            method: 'POST'
          });
          if (response.ok) {
            const data = await response.json();
            setDbUser(data);
            console.log("Account synced successfully:", data);
          } else {
            console.warn("Account sync failed:", await response.text());
          }
        } catch (error) {
          console.error("Error executing account sync:", error);
        }
      }
    };
    syncAccount();
  }, [oidc.isAuthenticated, accessToken, apiFetch]);

  const value: AuthContextType = {
    isAuthenticated: oidc.isAuthenticated,
    isLoading: oidc.isLoading,
    accessToken,
    email,
    fullName,
    role,
    approvalStatus,
    login,
    logout,
    apiFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <OidcAuthProvider {...oidcConfig}>
      <AuthProvider>{children}</AuthProvider>
    </OidcAuthProvider>
  );
};
