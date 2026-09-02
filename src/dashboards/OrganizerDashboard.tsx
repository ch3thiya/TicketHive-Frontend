import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Tag,
  AlertCircle,
  CheckCircle,
  Edit3,
  Ban,
  Layers,
  Send,
  Sliders,
  Bell,
  Users
} from 'lucide-react';

import { CreateEventPopUp } from '../popUps/CreateEventPopUp';
import { EditEventPopUp } from '../popUps/EditEventPopUp';
import { AddShowPopUp } from '../popUps/AddShowPopUp';
import { EditShowPopUp } from '../popUps/EditShowPopUp';
import { ConfirmDeletePopUp } from '../popUps/ConfirmDeletePopUp';

const CATALOG_API_URL =
  import.meta.env.VITE_CATALOG_API_URL || '';

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
  status: 'Draft' | 'Published' | 'Cancelled' | string;
  createdAt: string;
  shows: ShowDetails[];
}

interface NewTicketCategoryForm {
  name: string;
  price: string;
  capacity: string;
}

export const OrganizerDashboard: React.FC = () => {
  const { isAuthenticated, role, logout, apiFetch } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isAddShowOpen, setIsAddShowOpen] = useState(false);
  const [isEditShowOpen, setIsEditShowOpen] = useState(false);

  // Confirm Delete / Cancel Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Delete',
    onConfirm: () => {}
  });

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedShow, setSelectedShow] = useState<ShowDetails | null>(null);

  // Event Form State
  const [eventName, setEventName] = useState('');
  const [eventCategory, setEventCategory] = useState('Concert');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventBannerUrl, setEventBannerUrl] = useState('');
  const [cancellationCutoffHours, setCancellationCutoffHours] = useState('24');

  // Show Form State
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [showVenueId, setShowVenueId] = useState('');
  const [showOnSaleAt, setShowOnSaleAt] = useState('');
  const [showHighDemandThreshold, setShowHighDemandThreshold] = useState('');
  const [showReminderMinutesBefore, setShowReminderMinutesBefore] =
    useState('1440');

  const [showCategories, setShowCategories] = useState<
    NewTicketCategoryForm[]
  >([
    {
      name: 'General Admission',
      price: '50',
      capacity: '200'
    }
  ]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // Fetch organizer events
  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);

      const res = await apiFetch(
        `${CATALOG_API_URL}/api/catalog/events/my-events`
      );

      if (res.ok) {
        const data: EventItem[] = await res.json();
        setEvents(data);
      } else {
        const err = await res.text();
        console.warn('Failed to load organizer events:', err);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, apiFetch]);

  // Load events when organizer dashboard opens
  useEffect(() => {
    if (isAuthenticated && role === 'organizer') {
      fetchEvents();
    }
  }, [isAuthenticated, role, fetchEvents]);

  // Image Upload helper
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setEventBannerUrl(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  // Reset Event Form
  const resetEventForm = () => {
    setEventName('');
    setEventCategory('Concert');
    setEventDate('');
    setEventTime('');
    setEventDesc('');
    setEventBannerUrl('');
    setCancellationCutoffHours('24');
    setSelectedEvent(null);
  };

  // Reset Show Form
  const resetShowForm = () => {
    setShowDate('');
    setShowTime('');
    setShowVenueId('');
    setShowOnSaleAt('');
    setShowHighDemandThreshold('');
    setShowReminderMinutesBefore('1440');

    setShowCategories([
      {
        name: 'General Admission',
        price: '50',
        capacity: '200'
      }
    ]);

    setSelectedShow(null);
  };

  // Create Event Handler
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventName.trim()) {
      showNotification('Event Name is required.', true);
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        name: eventName.trim(),
        description: eventDesc.trim(),
        category: eventCategory.trim() || 'General',
        eventDate: eventDate ? eventDate : null,
        eventTime: eventTime
          ? eventTime.length === 5
            ? `${eventTime}:00`
            : eventTime
          : null,
        bannerUrl: eventBannerUrl.trim(),
        cancellationCutoffHours: cancellationCutoffHours
          ? parseInt(cancellationCutoffHours, 10)
          : null
      };

      const res = await apiFetch(
        `${CATALOG_API_URL}/api/catalog/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        showNotification(
          'Draft Event created successfully! Now add shows & ticket categories.'
        );

        setIsCreateEventOpen(false);
        resetEventForm();
        fetchEvents();
      } else {
        const errorData = await res.json().catch(() => null);

        showNotification(
          errorData?.message || 'Failed to create event.',
          true
        );
      }
    } catch (err) {
      console.error(err);

      showNotification(
        'An unexpected network error occurred.',
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update Event Handler
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEvent || !eventName.trim()) return;

    try {
      setIsLoading(true);

      const payload = {
        name: eventName.trim(),
        description: eventDesc.trim(),
        category: eventCategory.trim() || 'General',
        eventDate: eventDate ? eventDate : null,
        eventTime: eventTime
          ? eventTime.length === 5
            ? `${eventTime}:00`
            : eventTime
          : null,
        bannerUrl: eventBannerUrl.trim(),
        cancellationCutoffHours: cancellationCutoffHours
          ? parseInt(cancellationCutoffHours, 10)
          : null
      };

      const res = await apiFetch(
        `${CATALOG_API_URL}/api/catalog/events/${selectedEvent.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        showNotification('Event updated successfully.');

        setIsEditEventOpen(false);
        resetEventForm();
        fetchEvents();
      } else {
        const errorData = await res.json().catch(() => null);

        showNotification(
          errorData?.message || 'Failed to update event.',
          true
        );
      }
    } catch (err) {
      console.error(err);

      showNotification(
        'An unexpected network error occurred.',
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel Event Handler
  const handleCancelEvent = (eventId: string, eName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Event?',
      description: (
        <>
          Are you sure you want to cancel the event <strong className="text-ink-black">"{eName}"</strong>? This will set its status to Cancelled.
        </>
      ),
      confirmText: 'Cancel Event',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          setIsLoading(true);

          const res = await apiFetch(
            `${CATALOG_API_URL}/api/catalog/events/${eventId}/cancel`,
            {
              method: 'POST'
            }
          );

          if (res.ok) {
            showNotification('Event has been cancelled.');
            fetchEvents();
          } else {
            const errorData = await res.json().catch(() => null);
            showNotification(
              errorData?.message || 'Failed to cancel event.',
              true
            );
          }
        } catch (err) {
          console.error(err);
          showNotification('Error cancelling event.', true);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Publish Event Handler
  const handlePublishEvent = async (eventId: string) => {
    try {
      setIsLoading(true);

      const res = await apiFetch(
        `${CATALOG_API_URL}/api/catalog/events/${eventId}/publish`,
        {
          method: 'POST'
        }
      );

      if (res.ok) {
        showNotification(
          'Event successfully published to the live catalog!'
        );

        fetchEvents();
      } else {
        const errorData = await res.json().catch(() => null);

        showNotification(
          errorData?.message ||
            'Failed to publish event. Ensure at least one active show and ticket category exists.',
          true
        );
      }
    } catch (err) {
      console.error(err);

      showNotification(
        'An unexpected error occurred during publishing.',
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show Category Handlers
  const handleAddCategoryRow = () => {
    setShowCategories((prev) => [
      ...prev,
      {
        name: '',
        price: '',
        capacity: ''
      }
    ]);
  };

  const handleRemoveCategoryRow = (idx: number) => {
    setShowCategories((prev) =>
      prev.filter((_, i) => i !== idx)
    );
  };

  const handleCategoryChange = (
    idx: number,
    field: keyof NewTicketCategoryForm,
    val: string
  ) => {
    setShowCategories((prev) =>
      prev.map((cat, i) =>
        i === idx
          ? {
              ...cat,
              [field]: val
            }
          : cat
      )
    );
  };

  // Create Show Handler
  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEvent) return;

    if (!showDate || !showTime) {
      showNotification(
        'Show Date and Time are required.',
        true
      );
      return;
    }

    if (showCategories.length === 0) {
      showNotification(
        'At least one ticket category is required.',
        true
      );
      return;
    }

    const categoriesPayload = [];

    for (const cat of showCategories) {
      if (!cat.name.trim()) {
        showNotification(
          'Ticket category name is required.',
          true
        );
        return;
      }

      const price = parseFloat(cat.price);
      const capacity = parseInt(cat.capacity, 10);

      if (isNaN(price) || price < 0) {
        showNotification(
          'Invalid ticket price for category ' + cat.name,
          true
        );
        return;
      }

      if (isNaN(capacity) || capacity <= 0) {
        showNotification(
          'Capacity must be greater than 0 for category ' +
            cat.name,
          true
        );
        return;
      }

      categoriesPayload.push({
        name: cat.name.trim(),
        price,
        capacity
      });
    }

    try {
      setIsLoading(true);

      const formattedTime =
        showTime.length === 5
          ? `${showTime}:00`
          : showTime;

      const payload = {
        showDate,
        showTime: formattedTime,
        venueId: showVenueId.trim() || null,
        onSaleAt: showOnSaleAt
          ? new Date(showOnSaleAt).toISOString()
          : null,
        highDemandThreshold: showHighDemandThreshold
          ? parseInt(showHighDemandThreshold, 10)
          : null,
        reminderMinutesBefore: showReminderMinutesBefore
          ? parseInt(showReminderMinutesBefore, 10)
          : null,
        categories: categoriesPayload
      };

      const res = await apiFetch(
        `${CATALOG_API_URL}/api/catalog/events/${selectedEvent.id}/shows`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        showNotification(
          'Show and ticket categories added successfully!'
        );

        setIsAddShowOpen(false);
        resetShowForm();
        fetchEvents();
      } else {
        const errorData = await res.json().catch(() => null);

        showNotification(
          errorData?.message || 'Failed to create show.',
          true
        );
      }
    } catch (err) {
      console.error(err);

      showNotification(
        'An unexpected network error occurred.',
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update Show Handler
  const handleUpdateShow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedShow) return;

    try {
      setIsLoading(true);

      const formattedTime =
        showTime.length === 5
          ? `${showTime}:00`
          : showTime;

      const payload = {
        showDate,
        showTime: formattedTime,
        venueId: showVenueId.trim() || null,
        onSaleAt: showOnSaleAt
          ? new Date(showOnSaleAt).toISOString()
          : null,
        highDemandThreshold: showHighDemandThreshold
          ? parseInt(showHighDemandThreshold, 10)
          : null,
        reminderMinutesBefore: showReminderMinutesBefore
          ? parseInt(showReminderMinutesBefore, 10)
          : null,
        categories: showCategories.map(c => ({
          name: c.name.trim(),
          price: parseFloat(c.price) || 0,
          capacity: parseInt(c.capacity, 10) || 0
        }))
      };

      const res = await apiFetch(
        `${CATALOG_API_URL}/api/catalog/shows/${selectedShow.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        showNotification('Show updated successfully.');

        setIsEditShowOpen(false);
        resetShowForm();
        fetchEvents();
      } else {
        const errorData = await res.json().catch(() => null);

        showNotification(
          errorData?.message || 'Failed to update show.',
          true
        );
      }
    } catch (err) {
      console.error(err);

      showNotification(
        'An unexpected network error occurred.',
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel Show Handler
  const handleCancelShow = (showId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Show?',
      description: 'Are you sure you want to cancel this performance show? This will set its status to Cancelled.',
      confirmText: 'Cancel Show',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          setIsLoading(true);

          const res = await apiFetch(
            `${CATALOG_API_URL}/api/catalog/shows/${showId}/cancel`,
            {
              method: 'POST'
            }
          );

          if (res.ok) {
            showNotification('Show has been cancelled.');
            fetchEvents();
          } else {
            const errorData = await res.json().catch(() => null);
            showNotification(
              errorData?.message || 'Failed to cancel show.',
              true
            );
          }
        } catch (err) {
          console.error(err);
          showNotification('Error cancelling show.', true);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Helpers to open Edit Modals
  const openEditEventModal = (evt: EventItem) => {
    setSelectedEvent(evt);
    setEventName(evt.name);
    setEventCategory(evt.category || 'Concert');
    setEventDate(evt.eventDate || '');
    setEventTime(
      evt.eventTime
        ? evt.eventTime.substring(0, 5)
        : ''
    );
    setEventDesc(evt.description || '');
    setEventBannerUrl(evt.bannerUrl || '');

    setCancellationCutoffHours(
      evt.cancellationCutoffHours?.toString() || '24'
    );

    setIsEditEventOpen(true);
  };

  const openAddShowModal = (evt: EventItem) => {
    setSelectedEvent(evt);
    resetShowForm();

    if (evt.eventDate) {
      setShowDate(evt.eventDate);
    }

    if (evt.eventTime) {
      setShowTime(evt.eventTime.substring(0, 5));
    }

    setIsAddShowOpen(true);
  };

  const openEditShowModal = (show: ShowDetails) => {
    setSelectedShow(show);

    setShowDate(show.showDate);

    setShowTime(
      show.showTime
        ? show.showTime.substring(0, 5)
        : ''
    );

    setShowVenueId(show.venueId || '');

    setShowOnSaleAt(
      show.onSaleAt
        ? show.onSaleAt.substring(0, 16)
        : ''
    );

    setShowHighDemandThreshold(
      show.highDemandThreshold?.toString() || ''
    );

    setShowReminderMinutesBefore(
      show.reminderMinutesBefore?.toString() || '1440'
    );

    if (show.ticketCategories && show.ticketCategories.length > 0) {
      setShowCategories(
        show.ticketCategories.map((c) => ({
          name: c.name || '',
          price: c.price !== undefined && c.price !== null ? c.price.toString() : '',
          capacity: c.capacity !== undefined && c.capacity !== null ? c.capacity.toString() : ''
        }))
      );
    } else {
      setShowCategories([{ name: '', price: '', capacity: '' }]);
    }

    setIsEditShowOpen(true);
  };

  const goBackToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isAuthenticated || role !== 'organizer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F9FC] p-6 text-center">
        <div className="bg-brand-white border-3 border-ink-black rounded-32 p-8 shadow-soft-3d max-w-md w-full">
          <AlertCircle
            size={48}
            className="text-state-error mx-auto mb-4"
          />

          <h2 className="font-heading font-bold text-2xl text-ink-black mb-2">
            Access Denied
          </h2>

          <p className="font-body text-ink-gray-70 mb-6">
            Only approved event organizers can access the
            management console.
          </p>

          <button
            onClick={goBackToHome}
            className="font-body font-bold bg-brand-blue text-brand-white px-6 py-3 rounded-full border-3 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer select-none"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FC] flex flex-col font-body">

      {/* 1. Navbar */}
      <nav className="w-full bg-brand-white border-b-3 border-ink-black sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-6 h-[80px] flex items-center justify-between gap-4">

          <button
            onClick={goBackToHome}
            className="font-body font-bold text-sm text-ink-black hover:text-brand-blue flex items-center gap-1.5 cursor-pointer select-none transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Back to Home</span>
          </button>

          <div className="bg-brand-blue text-brand-white font-body font-bold text-[12px] uppercase tracking-[1.5px] px-6 py-1.5 rounded-full select-none border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F]">
            Organizer Console
          </div>

          <button
            onClick={logout}
            className="font-body font-bold text-[13px] text-[#FF3B3B] bg-brand-white border-2 border-ink-black rounded-full px-4 py-1.5 hover:bg-[#FF3B3B]/5 active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F]"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Notifications */}
      {errorMsg && (
        <div className="max-w-8xl mx-auto px-6 pt-4 w-full">
          <div className="bg-red-50 border-3 border-state-error text-state-error px-4 py-3 rounded-20 flex items-center gap-3 shadow-brutal-s">
            <AlertCircle size={20} className="shrink-0" />
            <span className="font-bold text-sm">
              {errorMsg}
            </span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="max-w-8xl mx-auto px-6 pt-4 w-full">
          <div className="bg-green-50 border-3 border-[#00B074] text-[#00875A] px-4 py-3 rounded-20 flex items-center gap-3 shadow-brutal-s">
            <CheckCircle size={20} className="shrink-0" />
            <span className="font-bold text-sm">
              {successMsg}
            </span>
          </div>
        </div>
      )}

      {/* 2. Main Content */}
      <main className="flex-grow max-w-8xl w-full mx-auto px-6 py-8">

        {/* Header CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-[32px] text-ink-black leading-none mb-2">
              Event Management
            </h1>
          </div>

          <button
            onClick={() => {
              resetEventForm();
              setIsCreateEventOpen(true);
            }}
            className="font-body font-bold text-[14px] text-ink-black bg-[#FFE94D] border-3 border-ink-black rounded-full px-6 py-3 hover:bg-[#F3DC3C] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F] flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Events List */}
        {isLoading && events.length === 0 ? (
          <div className="bg-brand-white border-3 border-ink-black rounded-28 p-12 text-center shadow-soft-3d">
            <p className="font-body font-bold text-ink-gray-70">
              Loading events...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-brand-white border-3 border-ink-black rounded-28 p-12 text-center shadow-soft-3d">
            <Layers
              size={48}
              className="mx-auto text-ink-gray-70 mb-3"
            />

            <h3 className="font-heading font-bold text-xl text-ink-black mb-2">
              No Events Found
            </h3>

            <p className="font-body text-ink-gray-70 max-w-md mx-auto mb-6">
              You haven't created any events yet. Click
              "Create New Event" to get started with your first
              event draft.
            </p>

            <button
              onClick={() => {
                resetEventForm();
                setIsCreateEventOpen(true);
              }}
              className="font-body font-bold text-sm bg-brand-blue text-brand-white border-2.5 border-ink-black rounded-full px-6 py-2.5 shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Create First Event
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {events.map((evt) => {
              const hasShows =
                evt.shows && evt.shows.length > 0;

              const hasCategories =
                hasShows &&
                evt.shows.some(
                  (s) =>
                    s.ticketCategories &&
                    s.ticketCategories.length > 0
                );

              const isDraft = evt.status === 'Draft';
              const isPublished =
                evt.status === 'Published';
              const isCancelled =
                evt.status === 'Cancelled';

              return (
                <div
                  key={evt.id}
                  className={`bg-brand-white border-3 border-ink-black rounded-28 p-6 lg:p-8 shadow-soft-3d flex flex-col gap-6 ${
                    isCancelled
                      ? 'opacity-75 bg-slate-50'
                      : ''
                  }`}
                >

                  {/* Event Top Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink-gray-30 pb-5">

                    <div className="flex flex-wrap items-center gap-3">

                      <span
                        className={`text-[12px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border-2 border-ink-black ${
                          isPublished
                            ? 'bg-[#00C875]/20 text-[#00875A]'
                            : isDraft
                            ? 'bg-[#FFE94D] text-ink-black'
                            : 'bg-red-100 text-[#E02F2F]'
                        }`}
                      >
                        {evt.status}
                      </span>

                      <span className="bg-brand-blue-light text-brand-blue text-[12px] font-bold px-3 py-1 rounded-full border-1.5 border-ink-black">
                        {evt.category || 'General'}
                      </span>

                      {evt.cancellationCutoffHours != null && (
                        <span className="text-[12px] font-semibold text-ink-gray-70 flex items-center gap-1 bg-ink-gray-30/40 px-3 py-1 rounded-full">
                          <Sliders size={13} />
                          <span>
                            Cancellation Policy:{' '}
                            {evt.cancellationCutoffHours}h
                            cutoff
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2">

                      {isDraft && (
                        <button
                          onClick={() =>
                            handlePublishEvent(evt.id)
                          }
                          disabled={!hasCategories || isLoading}
                          title={
                            !hasCategories
                              ? 'Event requires at least one show with ticket categories before publishing'
                              : 'Publish event live'
                          }
                          className="font-body font-bold text-[13px] text-brand-white bg-brand-blue border-2 border-ink-black rounded-full px-4 py-1.5 hover:bg-[#1a1a5b] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Send size={13} />
                          <span>Publish Event</span>
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() =>
                            openEditEventModal(evt)
                          }
                          className="font-body font-bold text-[13px] text-ink-black bg-brand-white border-2 border-ink-black rounded-full px-3.5 py-1.5 hover:bg-brand-blue-light transition-all cursor-pointer shadow-sm flex items-center gap-1.5 select-none"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() =>
                            handleCancelEvent(
                              evt.id,
                              evt.name
                            )
                          }
                          className="font-body font-bold text-[13px] text-[#FF3B3B] bg-brand-white border-2 border-ink-black rounded-full px-3.5 py-1.5 hover:bg-red-50 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 select-none"
                        >
                          <Ban size={13} />
                          <span>Cancel Event</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Event Core Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                    {/* Banner preview */}
                    <div className="w-full aspect-[16/9] lg:aspect-auto lg:h-36 rounded-20 border-2.5 border-ink-black overflow-hidden bg-brand-blue-light/30 relative">
                      {evt.bannerUrl ? (
                        <img
                          src={evt.bannerUrl}
                          alt={evt.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ink-gray-70 p-4">
                          <Tag
                            size={28}
                            className="mb-1 opacity-50"
                          />
                          <span className="text-xs font-semibold">
                            No Banner
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-3 flex flex-col gap-2">
                      <h2 className="font-heading font-bold text-[24px] text-ink-black leading-tight">
                        {evt.name}
                      </h2>

                      {evt.description && (
                        <p className="text-sm text-ink-gray-70 leading-relaxed max-w-3xl">
                          {evt.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink-gray-70 mt-1">

                        {evt.eventDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              size={14}
                              className="text-brand-blue"
                            />
                            <span>
                              Date: {evt.eventDate}
                            </span>
                          </div>
                        )}

                        {evt.eventTime && (
                          <div className="flex items-center gap-1.5">
                            <Clock
                              size={14}
                              className="text-brand-blue"
                            />
                            <span>
                              Time: {evt.eventTime}
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Shows & Ticket Categories */}
                  <div className="border-t-2 border-ink-gray-30 pt-5 flex flex-col gap-4">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-[18px] text-ink-black">
                          Scheduled Shows & Inventory
                        </h3>

                        <span className="text-xs font-bold bg-ink-gray-30 text-ink-black px-2.5 py-0.5 rounded-full">
                          {evt.shows?.length || 0}
                        </span>
                      </div>

                      {!isCancelled && (
                        <button
                          onClick={() =>
                            openAddShowModal(evt)
                          }
                          className="font-body font-bold text-[12px] text-brand-blue bg-brand-white border-2 border-ink-black rounded-full px-3.5 py-1 hover:bg-brand-blue-light transition-all cursor-pointer flex items-center gap-1 shadow-sm select-none"
                        >
                          <Plus
                            size={13}
                            strokeWidth={2.5}
                          />
                          <span>Add Show</span>
                        </button>
                      )}
                    </div>

                    {/* Shows List */}
                    {!evt.shows ||
                    evt.shows.length === 0 ? (
                      <div className="bg-[#F9F9FC] border-2 border-dashed border-ink-gray-30 rounded-20 p-5 text-center">
                        <p className="text-xs text-ink-gray-70 font-medium">
                          No shows scheduled yet. Add a show
                          with ticket categories before
                          publishing this event.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {evt.shows.map((show) => {
                          const isShowCancelled =
                            show.status === 'Cancelled';

                          return (
                            <div
                              key={show.id}
                              className={`bg-[#F9F9FC] border-2 border-ink-black rounded-20 p-5 flex flex-col gap-3.5 ${
                                isShowCancelled
                                  ? 'opacity-60 bg-red-50/50'
                                  : ''
                              }`}
                            >

                              {/* Show Header */}
                              <div className="flex items-center justify-between border-b border-ink-gray-30 pb-2.5">

                                <div className="flex items-center gap-2">
                                  <Calendar
                                    size={15}
                                    className="text-brand-blue"
                                  />

                                  <span className="font-bold text-sm text-ink-black">
                                    {show.showDate} ·{' '}
                                    {show.showTime
                                      ? show.showTime.substring(
                                          0,
                                          5
                                        )
                                      : ''}
                                  </span>
                                </div>

                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                    isShowCancelled
                                      ? 'bg-red-100 text-state-error border-state-error'
                                      : 'bg-[#00C875]/20 text-[#00875A] border-[#00875A]'
                                  }`}
                                >
                                  {show.status}
                                </span>
                              </div>

                              {/* Show Config Meta */}
                              <div className="grid grid-cols-2 gap-2 text-[12px] text-ink-gray-70">

                                {show.venueId && (
                                  <div
                                    className="truncate"
                                    title={show.venueId}
                                  >
                                    <span className="font-semibold text-ink-black">
                                      Venue:{' '}
                                    </span>
                                    {show.venueId.substring(
                                      0,
                                      8
                                    )}
                                    ...
                                  </div>
                                )}

                                {show.onSaleAt && (
                                  <div>
                                    <span className="font-semibold text-ink-black">
                                      On Sale:{' '}
                                    </span>
                                    {new Date(
                                      show.onSaleAt
                                    ).toLocaleDateString()}
                                  </div>
                                )}

                                {show.highDemandThreshold !=
                                  null && (
                                  <div className="flex items-center gap-1">
                                    <Users
                                      size={12}
                                      className="text-ink-black"
                                    />
                                    <span>
                                      Threshold:{' '}
                                      {
                                        show.highDemandThreshold
                                      }
                                    </span>
                                  </div>
                                )}

                                {show.reminderMinutesBefore !=
                                  null && (
                                  <div className="flex items-center gap-1">
                                    <Bell
                                      size={12}
                                      className="text-ink-black"
                                    />
                                    <span>
                                      Reminder:{' '}
                                      {
                                        show.reminderMinutesBefore
                                      }
                                      m
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Ticket Categories */}
                              <div className="flex flex-col gap-1.5">

                                <span className="text-[11px] font-bold text-ink-gray-70 uppercase tracking-wider">
                                  Ticket Categories
                                </span>

                                <div className="flex flex-wrap gap-2">

                                  {show.ticketCategories &&
                                  show.ticketCategories.length >
                                    0 ? (
                                    show.ticketCategories.map(
                                      (cat, idx) => (
                                        <div
                                          key={
                                            cat.id || idx
                                          }
                                          className="bg-brand-white border-1.5 border-ink-black rounded-12 px-3 py-1 text-xs flex items-center justify-between gap-3 shadow-[1px_1px_0px_0px_#0A0A0F]"
                                        >
                                          <span className="font-semibold text-ink-black">
                                            {cat.name}
                                          </span>

                                          <div className="flex items-center gap-2 font-bold">
                                            <span className="text-brand-blue">
                                              ${cat.price}
                                            </span>

                                            <span className="text-ink-gray-70">
                                              ({cat.capacity}{' '}
                                              cap)
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <span className="text-xs text-state-error">
                                      No categories defined
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Show Actions */}
                              {!isShowCancelled &&
                                !isCancelled && (
                                  <div className="flex items-center justify-end gap-2 border-t border-ink-gray-30 pt-2 mt-auto">

                                    <button
                                      onClick={() =>
                                        openEditShowModal(
                                          show
                                        )
                                      }
                                      className="text-xs font-bold text-ink-black hover:text-brand-blue flex items-center gap-1 cursor-pointer py-1 px-2"
                                    >
                                      <Edit3 size={12} />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleCancelShow(
                                          show.id
                                        )
                                      }
                                      className="text-xs font-bold text-state-error hover:text-red-700 flex items-center gap-1 cursor-pointer py-1 px-2"
                                    >
                                      <Ban size={12} />
                                      <span>
                                        Cancel Show
                                      </span>
                                    </button>

                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Create Event Modal */}
      <CreateEventPopUp
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onSubmit={handleCreateEvent}
        eventName={eventName}
        setEventName={setEventName}
        eventCategory={eventCategory}
        setEventCategory={setEventCategory}
        cancellationCutoffHours={cancellationCutoffHours}
        setCancellationCutoffHours={setCancellationCutoffHours}
        eventDate={eventDate}
        setEventDate={setEventDate}
        eventTime={eventTime}
        setEventTime={setEventTime}
        eventDesc={eventDesc}
        setEventDesc={setEventDesc}
        eventBannerUrl={eventBannerUrl}
        setEventBannerUrl={setEventBannerUrl}
        handleImageChange={handleImageChange}
        isLoading={isLoading}
      />

      {/* 4. Edit Event Modal */}
      <EditEventPopUp
        isOpen={isEditEventOpen}
        onClose={() => setIsEditEventOpen(false)}
        onSubmit={handleUpdateEvent}
        selectedEventName={selectedEvent?.name}
        eventName={eventName}
        setEventName={setEventName}
        eventCategory={eventCategory}
        setEventCategory={setEventCategory}
        cancellationCutoffHours={cancellationCutoffHours}
        setCancellationCutoffHours={setCancellationCutoffHours}
        eventDate={eventDate}
        setEventDate={setEventDate}
        eventTime={eventTime}
        setEventTime={setEventTime}
        eventDesc={eventDesc}
        setEventDesc={setEventDesc}
        eventBannerUrl={eventBannerUrl}
        setEventBannerUrl={setEventBannerUrl}
        handleImageChange={handleImageChange}
        isLoading={isLoading}
      />

      {/* 5. Add Show Modal */}
      <AddShowPopUp
        isOpen={isAddShowOpen && !!selectedEvent}
        onClose={() => setIsAddShowOpen(false)}
        onSubmit={handleCreateShow}
        selectedEventName={selectedEvent?.name}
        showDate={showDate}
        setShowDate={setShowDate}
        showTime={showTime}
        setShowTime={setShowTime}
        showVenueId={showVenueId}
        setShowVenueId={setShowVenueId}
        showHighDemandThreshold={showHighDemandThreshold}
        setShowHighDemandThreshold={setShowHighDemandThreshold}
        showCategories={showCategories}
        handleAddCategoryRow={handleAddCategoryRow}
        handleCategoryChange={handleCategoryChange}
        handleRemoveCategoryRow={handleRemoveCategoryRow}
        isLoading={isLoading}
      />

      {/* 6. Edit Show Modal */}
      <EditShowPopUp
        isOpen={isEditShowOpen && !!selectedShow}
        onClose={() => setIsEditShowOpen(false)}
        onSubmit={handleUpdateShow}
        showDate={showDate}
        setShowDate={setShowDate}
        showTime={showTime}
        setShowTime={setShowTime}
        showVenueId={showVenueId}
        setShowVenueId={setShowVenueId}
        showHighDemandThreshold={showHighDemandThreshold}
        setShowHighDemandThreshold={setShowHighDemandThreshold}
        showCategories={showCategories}
        handleAddCategoryRow={handleAddCategoryRow}
        handleCategoryChange={handleCategoryChange}
        handleRemoveCategoryRow={handleRemoveCategoryRow}
        isLoading={isLoading}
      />

      {/* 7. Confirm Delete / Cancel Modal */}
      <ConfirmDeletePopUp
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        isLoading={isLoading}
      />

    </div>
  );
};