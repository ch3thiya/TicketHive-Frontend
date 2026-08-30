import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';

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

// Hardcoded managed venues list matching the new design layout
const INITIAL_VENUES = [
  { name: 'Madison Square Garden', location: 'New York, NY', capacity: '20,789' },
  { name: 'SoFi Stadium', location: 'Inglewood, CA', capacity: '70,240' },
  { name: 'Crypto.com Arena', location: 'Los Angeles, CA', capacity: '19,068' },
  { name: 'Red Rocks Amphitheatre', location: 'Morrison, CO', capacity: '9,525' },
  { name: 'United Center', location: 'Chicago, IL', capacity: '23,500' },
  { name: 'Fenway Park', location: 'Boston, MA', capacity: '37,755' }
];

export const AdminDashboard: React.FC = () => {
  const { isAuthenticated, role, apiFetch, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track button action loading states
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  
  // Approved organizers list states
  const [organizers, setOrganizers] = useState<Array<{ organizationName?: string; businessEmail?: string; eventType?: string; fullName?: string; email?: string }>>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  // Custom neo-brutalist delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [deletingOrgName, setDeletingOrgName] = useState('');

  const [venues, setVenues] = useState(INITIAL_VENUES);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/identity/organizer-requests/pending`);
      setError(null);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch pending requests.');
      }
    } catch {
      setError('Unable to reach the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const fetchApprovedOrganizers = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/identity/organizer-requests/organizers`);
      if (response.ok) {
        const data = await response.json();
        setOrganizers(data);
      }
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
    } finally {
      setOrgsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      Promise.resolve().then(() => {
        fetchPendingRequests();
        fetchApprovedOrganizers();
      });
    }
  }, [isAuthenticated, role, fetchPendingRequests, fetchApprovedOrganizers]);

  const handleApprove = async (requestId: string) => {
    setActioningId(requestId);
    setActionType('approve');
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/identity/organizer-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.requestId !== requestId));
        fetchApprovedOrganizers(); // Refresh active organizers list
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to approve request.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setActioningId(null);
      setActionType(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActioningId(requestId);
    setActionType('reject');
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/identity/organizer-requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.requestId !== requestId));
        setIsDeleteModalOpen(false); // Close modal on success
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to reject request.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setActioningId(null);
      setActionType(null);
    }
  };

  const goBackToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleAddVenue = () => {
    const name = prompt('Enter venue name:');
    if (!name) return;
    const location = prompt('Enter venue location (e.g. Las Vegas, NV):');
    if (!location) return;
    const capacity = prompt('Enter capacity (e.g. 15,000):');
    if (!capacity) return;

    setVenues(prev => [...prev, { name, location, capacity }]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-white p-6 text-center">
        <h2 className="font-heading font-bold text-2xl text-ink-black mb-2">Access Denied</h2>
        <p className="font-body text-ink-gray-70 mb-4">You must be logged in as an administrator to view this portal.</p>
        <button
          onClick={goBackToHome}
          className="font-body font-bold bg-brand-blue text-brand-white px-6 py-2.5 rounded-full border-3 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all active:translate-y-px"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FC] flex flex-col font-body">
      
      {/* 1. Admin-Specific Navbar */}
      <nav className="w-full bg-brand-white border-b-3 border-ink-black sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-6 h-[80px] flex items-center justify-between gap-4">
          {/* Left: Back to Home Link */}
          <button
            onClick={goBackToHome}
            className="font-body font-bold text-sm text-ink-black hover:text-brand-blue flex items-center gap-1.5 cursor-pointer select-none transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Back to Home</span>
          </button>

          {/* Center: Admin Badge */}
          <div className="bg-ink-black text-brand-white font-body font-bold text-[12px] uppercase tracking-[1.5px] px-6 py-1.5 rounded-full select-none">
            Administrator
          </div>

          {/* Right: Brand Logo */}
          <div className="font-heading font-extrabold text-[24px] text-brand-blue select-none">
            TicketHive
          </div>
        </div>
      </nav>

      {/* 2. Main Dashboard Area */}
      <main className="flex-grow max-w-8xl w-full mx-auto px-6 py-8">
        
        {/* Title */}
        <h1 className="font-heading font-bold text-[32px] text-ink-black mb-7 leading-none">
          Platform Overview
        </h1>

        {/* 3. Pending Requests Card Box */}
        <div className="bg-brand-white border-3 border-ink-black rounded-28 p-8 shadow-soft-3d mb-8">
          <h2 className="font-heading font-bold text-[20px] text-ink-black mb-6">
            Pending Organizer Requests
          </h2>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-500 rounded-16 p-4 text-[#FF3B3B] font-medium text-sm">
              {error}
            </div>
          ) : requests.length === 0 ? (
            <div className="border-2 border-dashed border-ink-gray-30 rounded-20 py-12 text-center">
              <p className="font-body text-ink-gray-70 font-medium">No pending organizer registration requests at this time.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {requests.map((req) => (
                <div 
                  key={req.requestId}
                  className="bg-[#F9F9FC] border-2 border-ink-gray-30 rounded-20 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  {/* Info details */}
                  <div className="flex-1">
                    <h3 className="font-body font-bold text-[16px] text-ink-black mb-0.5">
                      {req.organizationName}
                    </h3>
                    <p className="font-body text-[13px] text-ink-gray-70 mb-3">
                      {req.businessEmail} · {req.eventType}
                    </p>
                    <p className="font-body text-[14px] text-ink-black leading-relaxed max-w-[720px]">
                      {req.about}
                    </p>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-6 shrink-0 max-md:w-full max-md:justify-between max-md:border-t max-md:border-ink-gray-30 max-md:pt-4">
                    <span className="font-body text-[13px] text-ink-gray-70">
                      2 days ago
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setDeletingRequestId(req.requestId);
                          setDeletingOrgName(req.organizationName);
                          setIsDeleteModalOpen(true);
                        }}
                        disabled={actioningId !== null}
                        className="font-body font-bold text-[14px] text-[#FF3B3B] bg-brand-white border-2 border-ink-black rounded-full px-5 py-1.5 hover:bg-[#FF3B3B]/5 active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F]"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.requestId)}
                        disabled={actioningId === req.requestId}
                        className="font-body font-bold text-[14px] text-brand-white bg-[#00B074] border-2 border-ink-black rounded-full px-5 py-1.5 hover:bg-[#009E66] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F]"
                      >
                        {actioningId === req.requestId && actionType === 'approve' ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3.1 Current Approved Organizers Section */}
        <div className="bg-brand-white border-3 border-ink-black rounded-28 p-8 shadow-soft-3d mb-8">
          <h2 className="font-heading font-bold text-[20px] text-ink-black mb-6">
            Current Organizers
          </h2>

          {orgsLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : organizers.length === 0 ? (
            <div className="border-2 border-dashed border-ink-gray-30 rounded-20 py-8 text-center">
              <p className="font-body text-ink-gray-70 font-medium">No approved organizers yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organizers.map((org, idx) => (
                <div 
                  key={idx}
                  className="bg-[#F9F9FC] border-2 border-ink-gray-30 rounded-20 p-5 flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex-1">
                    <h3 className="font-body font-bold text-[15px] text-ink-black mb-0.5">
                      {org.organizationName || org.fullName}
                    </h3>
                    <p className="font-body text-[12px] text-ink-gray-70">
                      {org.businessEmail || org.email} · {org.eventType || 'All Events'}
                    </p>
                  </div>
                  <div className="bg-brand-blue-light text-brand-blue text-[12px] font-bold px-4 py-1.5 rounded-full border-2 border-ink-black shrink-0">
                    Active
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Managed Venues Card Box */}
        <div className="bg-brand-white border-3 border-ink-black rounded-28 p-8 shadow-soft-3d">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-[20px] text-ink-black">
              Managed Venues
            </h2>
            <button
              onClick={handleAddVenue}
              className="font-body font-bold text-[13px] text-ink-black bg-[#FFE94D] border-2.5 border-ink-black rounded-full px-4 py-2 hover:bg-[#F3DC3C] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F] flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Add Venue</span>
            </button>
          </div>

          {/* Venue Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue, idx) => (
              <div 
                key={idx}
                className="bg-[#F9F9FC] border-2.5 border-ink-black rounded-16 p-5 flex flex-col gap-2 shadow-sm select-none hover:shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-px active:shadow-sm transition-all duration-150"
              >
                <h3 className="font-body font-bold text-[15px] text-ink-black">
                  {venue.name}
                </h3>
                <div className="flex items-center gap-1 text-[13px] text-ink-gray-70">
                  <MapPin size={13} className="text-[#FF3B3B] shrink-0" strokeWidth={2.5} />
                  <span>{venue.location}</span>
                </div>
                <div className="font-body font-bold text-[13px] text-brand-blue mt-1">
                  Capacity: {venue.capacity}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* 5. Custom Neo-Brutalist Reject Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[480px] p-8 flex flex-col items-center relative animate-in zoom-in-95 duration-200">
            
            {/* Warning Emoji Badge */}
            <div className="w-16 h-16 rounded-full border-3 border-ink-black flex items-center justify-center bg-[#FF3B3B]/10 shadow-[3px_3px_0px_0px_#0A0A0F] text-2xl select-none mb-5 animate-bounce">
              ⚠️
            </div>

            {/* Heading */}
            <h2 className="font-heading font-bold text-[24px] text-ink-black text-center mb-2 leading-tight">
              Delete Request?
            </h2>
            
            {/* Warning Subtitle */}
            <p className="font-body text-[14px] text-ink-gray-70 text-center mb-6 leading-relaxed">
              Are you sure you want to reject the request for <span className="font-bold text-ink-black">{deletingOrgName}</span>? This will permanently delete their account from the system.
            </p>

            {/* Action buttons */}
            <div className="flex gap-4 w-full">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingRequestId(null);
                }}
                disabled={actioningId !== null}
                className="flex-1 font-body font-bold text-[14px] text-ink-black bg-brand-white border-2.5 border-ink-black rounded-full py-3 hover:bg-brand-blue-light transition-all cursor-pointer active:translate-y-px select-none text-center outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingRequestId && handleReject(deletingRequestId)}
                disabled={actioningId !== null}
                className="flex-1 font-body font-bold text-[14px] text-brand-white bg-[#FF3B3B] border-2.5 border-ink-black rounded-full py-3 hover:bg-[#E02424] transition-all cursor-pointer active:translate-y-[2px] shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F] outline-none"
              >
                {actioningId !== null && actionType === 'reject' ? 'Deleting...' : 'Delete & Reject'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
