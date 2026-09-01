import React, { useState, useEffect } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ArrowLeft, Calendar, Clock, MapPin, Tag, ShieldAlert, Info } from 'lucide-react';

const CATALOG_API_URL =
  import.meta.env.VITE_CATALOG_API_URL || 'http://localhost:5142';

interface TicketCategory {
  id?: string;
  name: string;
  price: number;
  capacity: number;
}

interface ShowDetails {
  id: string;
  eventId: string;
  showDate: string;
  showTime: string;
  venueId?: string | null;
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
  bannerUrl: string;
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
    if (!dateStr) return 'Date TBD';
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
    if (!timeStr) return '';
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

  if (errorMsg || !event) {
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
          <Button variant="primary" size="M" shadow="S" onClick={onNavigateBack} className="mt-2">
            Browse All Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-brand-white pb-20">
      {/* Top Banner & Header */}
      <div className="w-full bg-brand-blue text-brand-white border-b-3 border-ink-black">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-6">
          <button
            onClick={onNavigateBack}
            className="self-start inline-flex items-center gap-2 font-body font-bold text-sm text-ink-black bg-surface-yellow border-2 border-ink-black rounded-full px-4 py-2 hover:bg-[#fce31c] cursor-pointer transition-all shadow-brutal-s"
          >
            <ArrowLeft size={16} />
            Back to Browse
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="yellow" uppercase={true}>
                  {event.category || 'General'}
                </Badge>
                <Badge variant="success" uppercase={true}>
                  Published
                </Badge>
              </div>

              <h1 className="font-heading font-extrabold text-3xl md:text-5xl text-brand-white leading-tight">
                {event.name}
              </h1>

              {(event.eventDate || event.eventTime) && (
                <div className="flex flex-wrap items-center gap-4 text-brand-white/90 font-body text-sm md:text-base">
                  {event.eventDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={18} />
                      {formatDate(event.eventDate)}
                    </span>
                  )}
                  {event.eventTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={18} />
                      {formatTime(event.eventTime)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Banner Image */}
            {event.bannerUrl && (
              <div className="w-full md:w-80 h-52 bg-brand-blue-light border-3 border-ink-black rounded-20 overflow-hidden shadow-brutal-s shrink-0">
                <img
                  src={event.bannerUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-12 w-full">
        {/* Description & Policy */}
        <section className="bg-brand-white border-3 border-ink-black rounded-28 p-6 md:p-8 shadow-brutal-m flex flex-col gap-4">
          <h2 className="font-heading font-bold text-2xl text-ink-black flex items-center gap-2">
            <Tag size={24} className="text-brand-blue" />
            About This Event
          </h2>
          <p className="font-body text-base text-ink-gray-70 whitespace-pre-line leading-relaxed">
            {event.description || 'No description provided for this event.'}
          </p>

          {event.cancellationCutoffHours !== null && event.cancellationCutoffHours !== undefined && (
            <div className="mt-4 pt-4 border-t-2 border-ink-gray-30 flex items-center gap-2 text-sm text-ink-gray-70 font-body">
              <span className="font-bold text-ink-black">Cancellation Policy:</span>
              <span>
                Cancellations permitted up to {event.cancellationCutoffHours} hours prior to showtime.
              </span>
            </div>
          )}
        </section>

        {/* Shows & Ticket Categories */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading font-bold text-2xl text-ink-black flex items-center gap-2">
            <Calendar size={24} className="text-brand-blue" />
            Scheduled Shows & Tickets
          </h2>

          {event.shows && event.shows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.shows.map((show, idx) => (
                <div
                  key={show.id || idx}
                  className="bg-brand-white border-3 border-ink-black rounded-28 p-6 shadow-brutal-m flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-lg text-brand-blue">
                        Show #{idx + 1}
                      </span>
                      <Badge variant="default" uppercase={true}>
                        {show.status || 'Active'}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1.5 font-body text-sm text-ink-black">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-ink-gray-70" />
                        <span className="font-bold">{formatDate(show.showDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-ink-gray-70" />
                        <span>{formatTime(show.showTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-ink-gray-70">
                        <MapPin size={16} />
                        <span>
                          {show.venueId ? `Venue: ${show.venueId}` : 'Venue: TBD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Categories for Show */}
                  <div className="flex flex-col gap-3 pt-4 border-t-2 border-ink-gray-30">
                    <span className="font-heading font-bold text-sm text-ink-black uppercase tracking-wider">
                      Ticket Categories
                    </span>

                    {show.ticketCategories && show.ticketCategories.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {show.ticketCategories.map((cat, cIdx) => (
                          <div
                            key={cat.id || cIdx}
                            className="bg-[#F9F9FC] border-2 border-ink-black rounded-14 p-3 flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="font-body font-bold text-sm text-ink-black">
                                {cat.name}
                              </span>
                              <span className="font-body text-xs text-ink-gray-70">
                                Total Capacity: {cat.capacity} seats/tickets
                              </span>
                            </div>
                            <span className="font-heading font-extrabold text-base text-brand-blue">
                              ${cat.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body text-xs text-ink-gray-70 italic">
                        No ticket categories listed for this show.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-brand-white border-3 border-ink-black rounded-28 p-8 text-center shadow-brutal-s">
              <p className="font-body text-ink-gray-70">No shows are currently scheduled for this event.</p>
            </div>
          )}
        </section>

        {/* Inventory Service Availability Integration Notice */}
        <section className="bg-brand-blue-light border-3 border-ink-black rounded-28 p-6 shadow-brutal-s flex items-start gap-4">
          <div className="p-2 bg-brand-blue text-brand-white rounded-full shrink-0 mt-0.5">
            <Info size={20} />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <h3 className="font-heading font-bold text-base text-ink-black">
              Ticket Availability Information
            </h3>
            <p className="font-body text-sm text-ink-gray-70 leading-relaxed">
              Ticket numbers shown above represent the planned seating capacity. Real-time ticket availability,
              seat allocations, and active booking reservations are managed dynamically through the Inventory Service.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
