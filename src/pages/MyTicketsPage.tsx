import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket as TicketIcon, QrCode, ArrowLeft, RefreshCw, CheckCircle2, Tag } from 'lucide-react';
import { Ticket } from '../components/Ticket';

const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL || '';

interface TicketItem {
  id: string;
  orderId: string;
  showId: string;
  categoryId: string;
  customerSub: string;
  uniqueCode: string;
  price: number;
  issuedAt: string;
  usedAt: string | null;
  usedBy: string | null;
}

interface MyTicketsPageProps {
  onNavigateHome: () => void;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({ onNavigateHome }) => {
  const { apiFetch, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'used'>('all');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const res = await fetch(`${BOOKING_API_URL}/api/catalog/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {}
    };
    fetchAllEvents();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${BOOKING_API_URL}/api/booking/tickets`);
      if (res.ok) {
        const data: TicketItem[] = await res.json();
        setTickets(data);
      } else {
        setError('Failed to load tickets. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching customer tickets:', err);
      setError('Network error while loading tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'valid') return !t.usedAt;
    if (filter === 'used') return Boolean(t.usedAt);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 w-full min-h-[calc(100vh-80px)] flex-grow flex flex-col animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6">
        <div>
          <div className="flex items-center gap-4">
            {/* <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 font-body font-bold text-xs md:text-sm text-ink-black bg-brand-white border-2 border-ink-black rounded-full px-4 py-2 hover:bg-[#F9F9FF] hover:text-brand-blue cursor-pointer transition-all shadow-[3px_3px_0px_0px_#0A0A0F] active:translate-y-px active:shadow-[1px_1px_0px_0px_#0A0A0F]"
              aria-label="Back to events"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Back</span>
            </button> */}
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-ink-black">
              My Tickets
            </h1>
          </div>
          <p className="font-body text-sm text-ink-gray-70 mt-2">
            Your confirmed e-tickets. Present the QR code at the event entry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="flex items-center gap-2 bg-brand-white hover:bg-[#F9F9FF] text-ink-black font-heading font-bold text-xs py-2.5 px-4 rounded-full border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      {tickets.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`font-heading font-bold text-xs py-2 px-5 rounded-full border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F] transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-brand-blue text-brand-white'
                : 'bg-brand-white text-ink-black hover:bg-[#F9F9FF]'
            }`}
          >
            All Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setFilter('valid')}
            className={`font-heading font-bold text-xs py-2 px-5 rounded-full border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F] transition-all cursor-pointer ${
              filter === 'valid'
                ? 'bg-emerald-600 text-brand-white'
                : 'bg-brand-white text-ink-black hover:bg-[#F9F9FF]'
            }`}
          >
            Valid ({tickets.filter((t) => !t.usedAt).length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`font-heading font-bold text-xs py-2 px-5 rounded-full border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F] transition-all cursor-pointer ${
              filter === 'used'
                ? 'bg-ink-gray-70 text-brand-white'
                : 'bg-brand-white text-ink-black hover:bg-[#F9F9FF]'
            }`}
          >
            Used ({tickets.filter((t) => t.usedAt).length})
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-heading font-bold text-base text-ink-black">Loading Your Tickets…</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border-3 border-ink-black rounded-32 p-8 text-center max-w-lg mx-auto shadow-brutal-s">
          <p className="font-heading font-bold text-rose-700 text-lg mb-4">{error}</p>
          <button
            onClick={fetchTickets}
            className="bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold px-6 py-2.5 rounded-full border-2 border-ink-black shadow-brutal-s"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State (SCRUM-18 AC4) */}
      {!isLoading && !error && tickets.length === 0 && (
        <div className="bg-brand-white border-3 border-ink-black rounded-[32px] p-12 text-center max-w-md mx-auto shadow-[8px_8px_0px_0px_#0A0A0F] flex flex-col items-center my-10 animate-in fade-in zoom-in duration-200">
          <div className="w-20 h-20 rounded-full bg-brand-blue-light border-3 border-ink-black flex items-center justify-center text-brand-blue mb-6 shadow-brutal-s">
            <TicketIcon size={40} strokeWidth={2.5} />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-ink-black mb-2">
            No Tickets Yet!
          </h2>
          <p className="font-body text-sm text-ink-gray-70 mb-6 leading-relaxed">
            You haven't bought any tickets yet. Explore live concerts, movies, and sports events to grab your tickets today!
          </p>
          <button
            onClick={onNavigateHome}
            className="bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-3.5 px-8 rounded-full border-3 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Browse Events
          </button>
        </div>
      )}

      {/* Tickets Grid (SCRUM-18 AC1 & AC2) */}
      {!isLoading && !error && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((t) => {
            const isUsed = Boolean(t.usedAt);
            const matchedEvent = events.find((e) => e.shows?.some((s: any) => s.id === t.showId));
            const matchedShow = matchedEvent?.shows?.find((s: any) => s.id === t.showId);

            return (
              <div
                key={t.id}
                className={`bg-brand-white border-3 border-ink-black rounded-32 p-6 shadow-[6px_6px_0px_0px_#0A0A0F] flex flex-col justify-between relative transition-all duration-200 ${
                  isUsed ? 'opacity-75 grayscale-[0.2]' : 'hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#0A0A0F]'
                }`}
              >
                {/* Event Banner & Badge */}
                {(matchedEvent?.coverImageUrl || matchedEvent?.coverUrl || matchedEvent?.bannerUrl || matchedEvent?.imageUrl) && (
                  <div className="w-full h-32 mb-4 rounded-20 overflow-hidden border-2 border-ink-black shrink-0 relative bg-ink-gray-30">
                    <img src={matchedEvent.coverImageUrl || matchedEvent.coverUrl || matchedEvent.bannerUrl || matchedEvent.imageUrl} alt={matchedEvent.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2">
                      {isUsed ? (
                        <span className="bg-ink-gray-30 text-ink-gray-70 border border-ink-black font-heading font-extrabold text-[11px] px-3 py-1 rounded-full uppercase shadow-sm">
                          USED
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-ink-black font-heading font-extrabold text-[11px] px-3 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm">
                          <CheckCircle2 size={12} />
                          VALID
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Status Badge (if no banner) */}
                {!(matchedEvent?.coverImageUrl || matchedEvent?.coverUrl || matchedEvent?.bannerUrl || matchedEvent?.imageUrl) && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-brand-blue" />
                      <span className="font-heading font-extrabold text-xs text-ink-gray-70 uppercase tracking-wider">
                        E-Ticket
                      </span>
                    </div>
                    {isUsed ? (
                      <span className="bg-ink-gray-30 text-ink-gray-70 border border-ink-black font-heading font-extrabold text-[11px] px-3 py-1 rounded-full uppercase">
                        REDEEMED / USED
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 border border-ink-black font-heading font-extrabold text-[11px] px-3 py-1 rounded-full uppercase flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        VALID
                      </span>
                    )}
                  </div>
                )}

                {/* Event Title & Date */}
                {matchedEvent && (
                  <div className="mb-4">
                    <h3 className="font-heading font-extrabold text-lg text-ink-black line-clamp-1">{matchedEvent.name}</h3>
                    {matchedShow && (
                      <p className="font-body text-xs font-semibold text-ink-gray-70 mt-1">
                        {new Date(matchedShow.showDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {matchedShow.showTime}
                      </p>
                    )}
                  </div>
                )}

                {/* Main Code Box */}
                <div className="bg-[#F9F9FF] border-2 border-ink-black rounded-20 p-4 mb-4 text-center shadow-brutal-s">
                  <div className="font-body text-[11px] font-bold text-ink-gray-70 uppercase tracking-widest mb-1">
                    UNIQUE TICKET CODE
                  </div>
                  <div className="font-mono font-extrabold text-xl text-brand-blue tracking-wider select-all">
                    {t.uniqueCode}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-2 mb-6 font-body text-xs text-ink-gray-70">
                  <div className="flex justify-between items-center pb-2 border-b border-ink-gray-30">
                    <span className="font-bold">Price Paid</span>
                    <span className="font-heading font-bold text-sm text-ink-black">
                      Rs. {t.price.toFixed(2)} LKR
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-ink-gray-30">
                    <span className="font-bold">Issued On</span>
                    <span className="font-medium text-ink-black">
                      {new Date(t.issuedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {isUsed && t.usedAt && (
                    <div className="flex justify-between items-center text-rose-600 font-bold">
                      <span>Used At</span>
                      <span>{new Date(t.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {/* Show QR Code Action Button */}
                <button
                  onClick={() => setSelectedTicket(t)}
                  className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-sm py-3 px-5 rounded-full border-2 border-ink-black shadow-[3px_3px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <QrCode size={18} />
                  <span>Show Ticket</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal Dialog (SCRUM-18 AC3) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[800px] animate-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-12 right-0 md:-right-12 w-10 h-10 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer bg-brand-white hover:bg-brand-blue hover:text-white transition-all shadow-[2px_2px_0px_0px_#0A0A0F]"
              aria-label="Close ticket popup"
            >
              <span className="font-body font-bold text-lg leading-none">✕</span>
            </button>
            
            {(() => {
              const matchedEvent = events.find((e) => e.shows?.some((s: any) => s.id === selectedTicket.showId));
              const matchedShow = matchedEvent?.shows?.find((s: any) => s.id === selectedTicket.showId);
              const category = matchedEvent?.ticketCategories?.find((c: any) => c.id === selectedTicket.categoryId || c.categoryId === selectedTicket.categoryId);
              
              if (!matchedEvent || !matchedShow) return null;
              
              return (
                <Ticket
                  eventDetails={{
                    name: matchedEvent.name,
                    date: matchedShow.showDate,
                    time: matchedShow.showTime,
                    categoryName: category?.name || 'General Admission',
                    bannerUrl: matchedEvent.coverImageUrl || matchedEvent.coverUrl || matchedEvent.bannerUrl || matchedEvent.imageUrl,
                    posterUrl: matchedEvent.imageUrl || matchedEvent.bannerUrl || matchedEvent.coverImageUrl || matchedEvent.coverUrl,
                  }}
                  ticketDetails={{
                    ...selectedTicket,
                    customerName: '',
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
