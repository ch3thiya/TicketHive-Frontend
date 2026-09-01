import React, { useState, useEffect } from 'react';
import { EventCard } from '../cards/EventCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Calendar, Filter, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

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
  status: string;
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
  status: string;
  createdAt: string;
  shows: ShowDetails[];
}

interface HomeProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (val: string) => void;
  onSelectEvent?: (eventId: string) => void;
}

const DEFAULT_CATEGORIES = ['All', 'Concerts', 'Movies', 'Sports', 'Festival', 'Theater', 'Conference'];

export const Home: React.FC<HomeProps> = ({
  searchQuery = '',
  onSearchChange,
  selectedCategory = 'All',
  onCategoryChange,
  onSelectEvent,
}) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Local filter states for date range and venue
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [venueIdFilter, setVenueIdFilter] = useState<string>('');

  const isDateRangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const dateError = isDateRangeInvalid ? "'From Date' cannot be after 'To Date'." : null;

  // Debounce search query to avoid spamming the backend
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (isDateRangeInvalid) {
      return;
    }

    let isMounted = true;
    const loadEvents = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const params = new URLSearchParams();
        if (debouncedSearch.trim()) {
          params.append('search', debouncedSearch.trim());
        }
        if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory.trim());
        }
        if (fromDate) {
          params.append('fromDate', fromDate);
        }
        if (toDate) {
          params.append('toDate', toDate);
        }
        if (venueIdFilter.trim()) {
          params.append('venueId', venueIdFilter.trim());
        }

        const queryString = params.toString();
        const url = queryString
          ? `${CATALOG_API_URL}/api/catalog/events?${queryString}`
          : `${CATALOG_API_URL}/api/catalog/events`;

        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch events (${response.status})`);
        }

        const data: EventItem[] = await response.json();
        if (isMounted) {
          setEvents(data);
        }
      } catch (err: unknown) {
        console.error('Error fetching published events:', err);
        if (isMounted) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Could not connect to Catalog Service. Please ensure the backend is running.'
          );
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedCategory, fromDate, toDate, venueIdFilter, reloadKey, isDateRangeInvalid]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    (selectedCategory && selectedCategory !== 'All') ||
    fromDate ||
    toDate ||
    venueIdFilter.trim()
  );

  const handleClearFilters = () => {
    onSearchChange?.('');
    onCategoryChange?.('All');
    setFromDate('');
    setToDate('');
    setVenueIdFilter('');
  };

  const formatDateDisplay = (event: EventItem) => {
    if (event.eventDate) {
      try {
        const parts = event.eventDate.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
        }
      } catch {
        return event.eventDate;
      }
    }

    if (event.shows && event.shows.length > 0) {
      const firstShow = event.shows[0];
      try {
        const parts = firstShow.showDate.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
        }
      } catch {
        return firstShow.showDate;
      }
    }

    return 'Date TBD';
  };

  const getLowestPrice = (event: EventItem): string | undefined => {
    if (!event.shows || event.shows.length === 0) return undefined;
    let minPrice: number | null = null;

    event.shows.forEach((show) => {
      if (show.ticketCategories) {
        show.ticketCategories.forEach((cat) => {
          if (minPrice === null || cat.price < minPrice) {
            minPrice = cat.price;
          }
        });
      }
    });

    const lowest = minPrice as number | null;
    return lowest !== null ? `From $${lowest.toFixed(2)}` : undefined;
  };

  const getVenueLabel = (event: EventItem): string | undefined => {
    if (!event.shows || event.shows.length === 0) return undefined;
    const showWithVenue = event.shows.find((s) => s.venueId);
    if (showWithVenue?.venueId) {
      return `Venue: ${showWithVenue.venueId.substring(0, 8)}...`;
    }
    return undefined;
  };

  // Featured event for hero banner (first published event, or null)
  const featuredEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="w-full flex flex-col bg-brand-white">
      {/* Hero Banner */}
      {!hasActiveFilters && (
        <section className="bg-brand-blue text-brand-white py-14 md:py-16 px-6 border-b-3 border-ink-black w-full relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col items-start gap-4 relative z-10">
            <Badge variant="yellow" uppercase={true}>
              🔥 Trending Now
            </Badge>
            <h1 className="font-heading font-extrabold text-[36px] md:text-[52px] text-brand-white leading-tight mt-1 max-w-3xl">
              {featuredEvent ? featuredEvent.name : 'Discover Live Music, Sports & Entertainment'}
            </h1>
            <p className="font-body text-[16px] md:text-[18px] text-brand-white/90 max-w-2xl">
              {featuredEvent
                ? `${formatDateDisplay(featuredEvent)} • Explore tickets, venues and scheduled shows.`
                : 'The easiest way to discover live events and book tickets you can trust.'}
            </p>

            {featuredEvent && (
              <Button
                variant="secondary"
                size="L"
                shadow="M"
                onClick={() => onSelectEvent?.(featuredEvent.id)}
                className="mt-2"
              >
                Get Tickets
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10 w-full">
        {/* Filter and Search Bar Section */}
        <section className="bg-brand-white border-3 border-ink-black rounded-28 p-6 shadow-brutal-m flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className="font-heading font-bold text-xl text-ink-black flex items-center gap-2">
              <Filter size={20} className="text-brand-blue" />
              Browse & Filter Events
            </h2>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-body font-bold text-state-error hover:underline cursor-pointer select-none"
              >
                <X size={14} />
                Clear All Filters
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected =
                (cat === 'All' && (!selectedCategory || selectedCategory === 'All')) ||
                selectedCategory.toLowerCase() === cat.toLowerCase();

              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange?.(cat)}
                  className={`font-body text-sm font-bold px-4 py-2 rounded-full border-2 border-ink-black transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-brand-blue text-brand-white shadow-brutal-s -translate-x-px -translate-y-px'
                      : 'bg-brand-white text-ink-black hover:bg-brand-blue-light'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Date Range & Additional Filter Controls */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-ink-gray-30 text-sm font-body">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-ink-gray-70" />
              <span className="font-bold text-ink-black text-xs uppercase tracking-wider">
                Date Range:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="filter-from-date" className="text-xs text-ink-gray-70 font-medium">
                From:
              </label>
              <input
                id="filter-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-[#F9F9FC] border-2 border-ink-black rounded-full px-3 py-1.5 text-xs text-ink-black outline-none focus:border-brand-blue font-body"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="filter-to-date" className="text-xs text-ink-gray-70 font-medium">
                To:
              </label>
              <input
                id="filter-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-[#F9F9FC] border-2 border-ink-black rounded-full px-3 py-1.5 text-xs text-ink-black outline-none focus:border-brand-blue font-body"
              />
            </div>

            {/* Optional Venue ID filter */}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="text"
                placeholder="Filter by Venue UUID..."
                value={venueIdFilter}
                onChange={(e) => setVenueIdFilter(e.target.value)}
                className="bg-[#F9F9FC] border-2 border-ink-black rounded-full px-3.5 py-1.5 text-xs text-ink-black outline-none focus:border-brand-blue font-body w-48 placeholder-ink-gray-70"
              />
            </div>
          </div>

          {dateError && (
            <span className="font-body text-xs font-semibold text-state-error">
              {dateError}
            </span>
          )}
        </section>

        {/* Results State Section */}
        {isLoading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="font-body font-semibold text-ink-black text-sm">
              Loading published events...
            </p>
          </div>
        ) : errorMsg ? (
          <div className="bg-brand-white border-3 border-ink-black rounded-28 p-8 shadow-brutal-m text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FFEBEB] border-2 border-ink-black flex items-center justify-center text-state-error">
              <AlertCircle size={28} />
            </div>
            <h3 className="font-heading font-bold text-xl text-ink-black">
              Unable to Load Events
            </h3>
            <p className="font-body text-sm text-ink-gray-70 max-w-md">
              {errorMsg}
            </p>
            <Button
              variant="primary"
              size="M"
              shadow="S"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-2 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Retry
            </Button>
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="bg-brand-white border-3 border-ink-black rounded-28 p-12 shadow-brutal-m text-center flex flex-col items-center gap-4 my-6">
            <div className="w-16 h-16 rounded-full bg-surface-yellow border-2 border-ink-black flex items-center justify-center text-ink-black text-2xl select-none">
              🔍
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-ink-black">
              No events found
            </h3>
            <p className="font-body text-sm text-ink-gray-70 max-w-md">
              {hasActiveFilters
                ? 'No published events match your active search or filter criteria. Try adjusting your keyword or clearing filters.'
                : 'There are currently no published events available. Check back soon!'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="M"
                shadow="S"
                onClick={handleClearFilters}
                className="mt-2"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          /* Event Grid */
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-2xl text-ink-black flex items-center gap-2">
                <Sparkles size={22} className="text-brand-blue" />
                {hasActiveFilters ? 'Search & Filter Results' : 'Explore All Published Events'}
              </h2>
              <span className="font-body font-bold text-xs bg-surface-yellow border-2 border-ink-black rounded-full px-3 py-1 text-ink-black select-none shadow-brutal-s">
                {events.length} {events.length === 1 ? 'Event' : 'Events'} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {events.map((evt) => (
                <EventCard
                  key={evt.id}
                  title={evt.name}
                  date={formatDateDisplay(evt)}
                  category={evt.category}
                  image={evt.bannerUrl}
                  price={getLowestPrice(evt)}
                  venue={getVenueLabel(evt)}
                  onClick={() => onSelectEvent?.(evt.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
