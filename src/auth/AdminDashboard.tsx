import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface PendingRequest {
  requestId: string;
  accountId: string;
  organizationName: string;
  businessEmail: string;
  phone: string;
  eventType: string;
  about: string;
  status: string;
  createdAt: string;
  fullName: string;
  userEmail: string;
}

const API_BASE_URL = 'http://localhost:5051';

export const AdminDashboard: React.FC = () => {
  const { isAuthenticated, role, apiFetch, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/identity/organizer-requests/pending`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch pending requests.');
      }
    } catch (err) {
      setError('Unable to reach the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      fetchPendingRequests();
    }
  }, [isAuthenticated, role]);

  const handleApprove = async (requestId: string) => {
    setActioningId(requestId);
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/identity/organizer-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Organizer request approved successfully! 🎉');
        setRequests(prev => prev.filter(r => r.requestId !== requestId));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to approve request.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this organizer request?')) return;
    
    setActioningId(requestId);
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/identity/organizer-requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Organizer request rejected.');
        setRequests(prev => prev.filter(r => r.requestId !== requestId));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to reject request.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <p className="font-body text-ink-gray-70 animate-pulse">Checking credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-white p-6">
        <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d p-8 max-w-[480px] text-center">
          <Badge variant="error" className="mb-4">Access Denied</Badge>
          <h2 className="font-heading font-bold text-2xl text-ink-black mb-2">Administrator Access Required</h2>
          <p className="font-body text-ink-gray-70 mb-6">
            You must be logged in as an administrator to view this page.
          </p>
          <Button variant="primary" onClick={() => { window.history.pushState({}, '', '/admin-login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
            Log In as Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-blue-light/20 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b-2 border-ink-black/10 gap-4">
          <div>
            <h1 className="font-heading font-bold text-3xl text-ink-black mb-1">Admin Control Panel</h1>
            <p className="font-body text-sm text-ink-gray-70">Review and manage pending Organizer requests.</p>
          </div>
          <Button variant="secondary" onClick={fetchPendingRequests} disabled={loading}>
            Refresh Requests
          </Button>
        </header>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl mb-6">
            <p className="font-body text-sm font-semibold">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-brutal p-12 text-center max-w-xl mx-auto mt-8">
            <h3 className="font-heading font-bold text-xl mb-2 text-ink-black">No Pending Requests! 🏖️</h3>
            <p className="font-body text-sm text-ink-gray-70">
              All organizer signup requests have been reviewed. There is nothing pending approval at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map(req => (
              <div 
                key={req.requestId} 
                className="bg-brand-white border-3 border-ink-black rounded-28 shadow-brutal p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center transition-all duration-150 hover:shadow-soft-3d"
              >
                <div className="flex-grow space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-heading font-bold text-lg text-ink-black">{req.organizationName}</h3>
                    <Badge variant="active">{req.eventType}</Badge>
                    <span className="font-body text-xs text-ink-gray-70">
                      Submitted: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 font-body text-sm text-ink-gray-70">
                    <p><span className="font-semibold text-ink-black">Contact:</span> {req.fullName}</p>
                    <p><span className="font-semibold text-ink-black">Business Email:</span> {req.businessEmail}</p>
                    <p><span className="font-semibold text-ink-black">Phone:</span> {req.phone}</p>
                  </div>
                  
                  <div className="bg-brand-blue-light/10 border border-ink-black/10 rounded-xl p-3 max-w-2xl">
                    <p className="font-body text-xs font-semibold text-ink-black mb-1">About the organizer:</p>
                    <p className="font-body text-sm text-ink-gray-70 italic">"{req.about}"</p>
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 w-full md:w-auto shrink-0">
                  <Button 
                    variant="primary" 
                    className="flex-1 md:w-32 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleApprove(req.requestId)}
                    disabled={actioningId === req.requestId}
                  >
                    {actioningId === req.requestId ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-1 md:w-32 bg-red-100 hover:bg-red-200 text-red-600 border-red-300"
                    onClick={() => handleReject(req.requestId)}
                    disabled={actioningId === req.requestId}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
