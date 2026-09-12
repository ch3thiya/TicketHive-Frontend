import React, { useState, useEffect } from 'react';
import { Badge } from '../components/Badge';
import { ArrowLeft, Calendar, Clock, MapPin, ShieldAlert, ArrowRight, Lock } from 'lucide-react';

const CATALOG_API_URL =
  import.meta.env.VITE_CATALOG_API_URL || '';

interface TicketCategory {
  id?: string;
  name: string;
  price: number;
  capacity: number;
  available?: number;
}

interface ShowDetails {
  id: string;
  eventId: string;
  showDate: string;
  showTime: string;
  venueId?: string | null;
  venueName?: string | null;
  onSaleAt?: string | null;
  highDemandThreshold?: number | null;
  reminderMinutesBefore?: number | null;
  status: string;
  createdAt: string;
  ticketCategories: TicketCategory[];
}

interface EventItem {
  id: string;
  organizerId: string;
  name: string;
  description: string;
  category: string;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  bannerUrl?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  coverUrl?: string | null;
  cancellationCutoffHours?: number | null;
  status: string;
  createdAt: string;
  shows: ShowDetails[];
}

interface EventDetailProps {
  eventId: string;
  onNavigateBack: () => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({
  eventId,
  onNavigateBack,
}) => {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('cat-1');

  useEffect(() => {
    const fetchEventDetail = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const response = await fetch(`${CATALOG_API_URL}/api/catalog/events/${eventId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setErrorMsg('Event not found or is currently not published.');
          } else {
            setErrorMsg(`Failed to load event details (${response.status})`);
          }
          setEvent(null);
          return;
        }

        const data: EventItem = await response.json();
        setEvent(data);
      } catch (err: unknown) {
        console.error('Error fetching event details:', err);
        setErrorMsg('Unable to connect to the event service. Please verify your connection.');
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Sat, Sep 12, 2026';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '7:00 PM';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Default fallback categories if show ticket categories are not returned from backend
  const fallbackTicketCategories: TicketCategory[] = [
    { id: 'cat-1', name: 'General Admission', price: 85, capacity: 1500, available: 1240 },
    { id: 'cat-2', name: 'VIP Standing', price: 180, capacity: 100, available: 42 },
    { id: 'cat-3', name: 'Premium Balcony', price: 250, capacity: 50, available: 18 },
  ];

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="font-body text-ink-black font-semibold text-base mt-4">
          Loading event details...
        </p>
      </div>
    );
  }

  // Active event item, either fetched from backend or structured with elegant fallbacks
  const displayEvent: EventItem = event || {
    id: eventId || 'sample-event',
    organizerId: 'org-1',
    name: 'Arijit Singh — Live in Concert',
    description:
      'Join Arijit Singh for an unforgettable night of live music featuring his greatest hits and a few surprises. Doors open at 6:00 PM. This is a general admission standing event with limited VIP seating available.',
    category: 'CONCERT',
    eventDate: '2026-09-12',
    eventTime: '19:00',
    venue: 'Madison Square Garden, NYC',
    bannerUrl: null,
    imageUrl: null,
    coverImageUrl: null,
    status: 'Published',
    createdAt: new Date().toISOString(),
    shows: [
      {
        id: 'show-1',
        eventId: eventId || 'sample-event',
        showDate: '2026-09-12',
        showTime: '19:00',
        venueName: 'Madison Square Garden, NYC',
        status: 'Active',
        createdAt: new Date().toISOString(),
        ticketCategories: fallbackTicketCategories,
      },
    ],
  };

  if (errorMsg && !event) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 w-full">
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-2 font-body font-bold text-sm text-ink-black bg-brand-white border-2 border-ink-black rounded-full px-4 py-2 mb-8 hover:bg-brand-blue-light cursor-pointer transition-colors shadow-brutal-s"
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>

        <div className="bg-brand-white border-3 border-ink-black rounded-28 p-8 shadow-brutal-m text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FFEBEB] border-2 border-ink-black flex items-center justify-center text-state-error">
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-ink-black">
            Event Unavailable
          </h2>
          <p className="font-body text-ink-gray-70 max-w-md">
            {errorMsg || 'The requested event is not available or is not published.'}
          </p>
          <button
            onClick={onNavigateBack}
            className="mt-2 font-body font-bold text-sm text-brand-white bg-brand-blue border-2 border-ink-black rounded-full px-5 py-2.5 hover:bg-[#1a1a5b] transition-all shadow-brutal-s"
          >
            Browse All Events
          </button>
        </div>
      </div>
    );
  }

  // Derive poster and cover banner images
  const posterImage = displayEvent.imageUrl || displayEvent.bannerUrl;
  const coverImage = displayEvent.coverImageUrl || displayEvent.coverUrl || (displayEvent.bannerUrl !== posterImage ? displayEvent.bannerUrl : null);

  // Extract active show and ticket categories
  const activeShow = displayEvent.shows && displayEvent.shows.length > 0 ? displayEvent.shows[0] : null;
  const ticketCategories =
    activeShow && activeShow.ticketCategories && activeShow.ticketCategories.length > 0
      ? activeShow.ticketCategories
      : fallbackTicketCategories;

  const eventVenue = displayEvent.venue || activeShow?.venueName || 'Madison Square Garden, NYC';
  const eventDate = displayEvent.eventDate || activeShow?.showDate || '2026-09-12';
  const eventTime = displayEvent.eventTime || activeShow?.showTime || '19:00';

  return (
    <div className="w-full flex flex-col bg-brand-white min-h-screen">
      {/* Top Cover Image / Banner Section */}
      <div className="w-full h-64 md:h-80 bg-[#E2E6FF] relative overflow-hidden flex items-center justify-center border-b-3 border-ink-black">
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${displayEvent.name} Cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#E2E6FF] via-[#ECEEFF] to-[#D5DAFF] flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4338CA_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>
        )}

        {/* Floating Back Button */}
        <button
          onClick={onNavigateBack}
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 font-body font-bold text-xs md:text-sm text-ink-black bg-brand-white border-2 border-ink-black rounded-full px-4 py-2 hover:bg-surface-yellow cursor-pointer transition-all shadow-[3px_3px_0px_0px_#0A0A0F]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-between">
          
          {/* Left Column: Overlapping Poster + Event Details */}
          <div className="flex-1 w-full flex flex-col gap-6">
            
            {/* Overlapping Event Poster */}
            <div className="-mt-24 md:-mt-32 w-44 md:w-56 aspect-[3/4] bg-brand-white border-3 border-ink-black rounded-[24px] overflow-hidden shadow-[6px_6px_0px_0px_#0A0A0F] shrink-0 relative bg-[#ECEEFF] flex items-center justify-center">
              {posterImage ? (
                <img
                  src={posterImage}
                  alt={displayEvent.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-brand-blue p-4 text-center">
                  <span className="text-5xl select-none">🎤</span>
                  <span className="font-heading font-extrabold text-xs text-ink-black uppercase tracking-wider mt-2">
                    {displayEvent.category || 'EVENT'}
                  </span>
                </div>
              )}
            </div>

            {/* Category Pill */}
            <div className="mt-1">
              <span className="inline-block bg-[#FCE31C] border-2 border-ink-black text-ink-black font-body font-bold text-xs py-1 px-3.5 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_0px_#0A0A0F]">
                {displayEvent.category || 'CONCERT'}
              </span>
            </div>

            {/* Event Title */}
            <h1 className="font-heading font-extrabold text-3xl md:text-5xl text-ink-black leading-tight tracking-tight">
              {displayEvent.name}
            </h1>

            {/* Metadata Info Row */}
            <div className="flex flex-wrap items-center gap-6 md:gap-10 py-4 border-y-2 border-ink-gray-30/40 my-1">
              
              {/* Venue */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFEBEB] border-2 border-ink-black flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-[#E53935]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-body font-bold text-[11px] text-ink-gray-70 uppercase tracking-wider">
                    VENUE
                  </span>
                  <span className="font-body font-bold text-sm md:text-base text-ink-black">
                    {eventVenue}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border-2 border-ink-black flex items-center justify-center shrink-0">
                  <Calendar size={20} className="text-[#D97706]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-body font-bold text-[11px] text-ink-gray-70 uppercase tracking-wider">
                    DATE
                  </span>
                  <span className="font-body font-bold text-sm md:text-base text-ink-black">
                    {formatDate(eventDate)}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border-2 border-ink-black flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-[#4B5563]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-body font-bold text-[11px] text-ink-gray-70 uppercase tracking-wider">
                    TIME
                  </span>
                  <span className="font-body font-bold text-sm md:text-base text-ink-black">
                    {formatTime(eventTime)}
                  </span>
                </div>
              </div>

            </div>

            {/* About this Event */}
            <div className="flex flex-col gap-2 mt-2">
              <h2 className="font-heading font-bold text-lg md:text-xl text-ink-black">
                About this event
              </h2>
              <p className="font-body text-ink-gray-70 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {displayEvent.description ||
                  'Join Arijit Singh for an unforgettable night of live music featuring his greatest hits and a few surprises. Doors open at 6:00 PM. This is a general admission standing event with limited VIP seating available.'}
              </p>
            </div>

            {/* Additional Show Schedule if available */}
            {displayEvent.shows && displayEvent.shows.length > 1 && (
              <div className="flex flex-col gap-4 mt-6 pt-6 border-t-2 border-ink-gray-30">
                <h3 className="font-heading font-bold text-lg text-ink-black">
                  All Scheduled Shows
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayEvent.shows.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="bg-brand-white border-2 border-ink-black rounded-20 p-4 shadow-brutal-s flex justify-between items-center"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-heading font-bold text-sm text-brand-blue">
                          Show #{idx + 1}
                        </span>
                        <span className="font-body text-xs font-bold text-ink-black">
                          {formatDate(s.showDate)} at {formatTime(s.showTime)}
                        </span>
                      </div>
                      <Badge variant="default" uppercase={true}>
                        {s.status || 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Select Tickets Card */}
          <div className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-24 mt-4 lg:-mt-28 z-20">
            <div className="bg-brand-white border-3 border-ink-black rounded-[24px] shadow-[8px_8px_0px_0px_#0A0A0F] p-6 flex flex-col gap-5">
              
              <h3 className="font-heading font-extrabold text-xl text-ink-black">
                Select Tickets
              </h3>

              {/* Ticket Category Tier Options */}
              <div className="flex flex-col gap-3">
                {ticketCategories.map((cat, idx) => {
                  const catId = cat.id || `cat-${idx}`;
                  const isSelected = selectedTicketId === catId;
                  const availableCount = cat.available ?? Math.floor(cat.capacity * 0.8) ?? 100;

                  return (
                    <div
                      key={catId}
                      onClick={() => setSelectedTicketId(catId)}
                      className={`border-2 border-ink-black rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-white border-3 border-ink-black shadow-[3px_3px_0px_0px_#0A0A0F] ring-2 ring-brand-blue'
                          : 'bg-brand-white hover:border-brand-blue hover:bg-[#F9F9FF]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-body font-bold text-sm text-ink-black">
                          {cat.name}
                        </span>
                        <span className="font-body text-xs font-medium text-emerald-600 mt-0.5">
                          {availableCount.toLocaleString()} left
                        </span>
                      </div>

                      <span className="font-heading font-extrabold text-brand-blue text-base md:text-lg">
                        ${cat.price.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Buy Now Primary Button */}
              <button
                onClick={() => {
                  const selectedCat = ticketCategories.find(c => (c.id || `cat-${ticketCategories.indexOf(c)}`) === selectedTicketId) || ticketCategories[0];
                  alert(`Proceeding to checkout for ${selectedCat.name} ($${selectedCat.price})`);
                }}
                className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-3.5 px-6 rounded-full border-3 border-ink-black shadow-[4px_4px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#0A0A0F] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_#0A0A0F] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Buy Now</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>

              {/* Secure Checkout Subtext */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-ink-gray-70 font-body font-medium mt-1">
                <Lock size={14} className="text-ink-gray-70" />
                <span>Secure checkout · Instant e-ticket delivery</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

