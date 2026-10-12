import { GATEWAY_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CheckCircle2, AlertCircle, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Ticket } from '../components/Ticket';
import { OrderCancellation } from '../components/OrderCancellation';
import { SeatSelection, type SelectedSeat } from '../components/SeatSelection';
import { WaitingRoomPopUp } from '../popUps/WaitingRoomPopUp';
import { createSeatHold, type SeatHoldOutcome } from '../common/seatApi';
import type { SeatCategoryInfo } from '../components/SeatMap';

const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL || '';
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || BOOKING_API_URL;
const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL || '';

interface CheckoutPageProps {
  orderId?: string;
  showId?: string;
  targetCount?: number;
  onNavigateHome: () => void;
}

// The part of a ticket the confirmation page reads; the rest is passed through to the ticket.
interface OrderTicket {
  id?: string;
  orderId: string;
  uniqueCode: string;
  voidedAt?: string | null;
  categoryId?: string;
  price: number;
  seat?: { section: string; row: string; number: number } | null;
  [key: string]: unknown;
}

interface ShowCategory {
  id?: string;
  categoryId?: string;
  name: string;
}

interface OrderStatusResponse {
  orderId: string;
  status: 'PaymentPending' | 'Confirmed' | 'Failed' | 'Cancelled';
  totalAmount: number;
  currency: string;
  createdAt?: string;
  expiresAt?: string;
  isExpired?: boolean;
  updatedAt: string;
}

interface PayHereCheckoutParams {
  merchantId: string;
  orderId: string;
  items: string;
  amount: number;
  currency: string;
  hash: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

declare global {
  interface Window {
    payhere?: {
      startPayment: (payment: Record<string, unknown>) => void;
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
    };
  }
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ orderId: initialOrderId, showId, targetCount, onNavigateHome }) => {
  const { apiFetch, email: authEmail, fullName: authFullName, profile, isAuthenticated, login } = useAuth();
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>(initialOrderId);
  const [showEventData, setShowEventData] = useState<any | null>(null);
  const [seatCategories, setSeatCategories] = useState<Record<string, SeatCategoryInfo>>({});
  const [seatStepError, setSeatStepError] = useState<string | null>(null);
  const [isHoldingSeats, setIsHoldingSeats] = useState(false);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);
  const [pendingSeats, setPendingSeats] = useState<SelectedSeat[] | null>(null);
  const [admissionToken, setAdmissionToken] = useState<string | null>(null);

  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse | null>(null);
  const [payHereParams, setPayHereParams] = useState<PayHereCheckoutParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  const [eventDetails, setEventDetails] = useState<any | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any | null>(null);
  // Every ticket of the order: a seated order has one ticket (and seat) per seat chosen.
  const [orderTickets, setOrderTickets] = useState<OrderTicket[]>([]);

  // When initialOrderId changes from router, keep activeOrderId in sync
  useEffect(() => {
    if (initialOrderId) {
      setActiveOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  // Load show details and categories if showId is provided
  useEffect(() => {
    if (!showId) return;

    const loadShowInfo = async () => {
      try {
        const eventsRes = await fetch(`${CATALOG_API_URL}/api/catalog/events`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const targetId = showId.toLowerCase();
          const matchedEvent = eventsData.find((e: any) => e.shows?.some((s: any) => s.id?.toLowerCase() === targetId));
          if (matchedEvent) {
            const matchedShow = matchedEvent.shows.find((s: any) => s.id?.toLowerCase() === targetId);
            setShowEventData({ event: matchedEvent, show: matchedShow });

            const cats: Record<string, SeatCategoryInfo> = {};
            const categoriesList = matchedShow?.ticketCategories ?? matchedEvent?.ticketCategories ?? [];
            categoriesList.forEach((c: any, idx: number) => {
              const id = c.id || c.categoryId || `cat-${idx}`;
              cats[id] = { name: c.name, price: Number(c.price) };
            });
            setSeatCategories(cats);

            // Seed eventDetails early if not yet set
            setEventDetails((prev: any) => prev || {
              bannerUrl: matchedEvent.coverImageUrl || matchedEvent.coverUrl || matchedEvent.bannerUrl || matchedEvent.imageUrl,
              posterUrl: matchedEvent.imageUrl || matchedEvent.bannerUrl || matchedEvent.coverImageUrl || matchedEvent.coverUrl,
              name: matchedEvent.name,
              date: matchedShow?.showDate,
              time: matchedShow?.showTime,
              categoryName: categoriesList[0]?.name || 'General Admission',
              categories: categoriesList,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load show details for seat selection:', err);
      }
    };

    loadShowInfo();
  }, [showId]);

  const isEmail = (val: unknown): val is string =>
    typeof val === 'string' && val.includes('@') && val.includes('.');

  // Customer billing details prefilled with registered user info
  const [customerDetails, setCustomerDetails] = useState(() => {
    const userEmail = isEmail(authEmail)
      ? authEmail
      : isEmail(profile?.email)
        ? (profile.email as string)
        : isEmail(profile?.username)
          ? (profile.username as string)
          : isEmail(profile?.preferred_username)
            ? (profile.preferred_username as string)
            : '';

    let fName = (profile?.given_name as string) || (profile?.givenName as string) || (profile?.nickname as string) || '';
    let lName = (profile?.family_name as string) || (profile?.familyName as string) || '';

    if (!fName && authFullName && !authFullName.includes('@')) {
      const parts = authFullName.trim().split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }

    return {
      firstName: fName,
      lastName: lName,
      email: userEmail,
      phone: '',
      address: '',
      city: '',
      country: 'Sri Lanka',
    };
  });

  const [formErrors, setFormErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

  // Sync user info if auth profile loads after initial mount
  useEffect(() => {
    if (authEmail || authFullName || profile) {
      setCustomerDetails((prev) => {
        const validAuthEmail = isEmail(authEmail) ? authEmail : prev.email;
        let newFName = prev.firstName;
        let newLName = prev.lastName;

        if (!newFName) {
          newFName = (profile?.given_name as string) || (profile?.givenName as string) || (profile?.nickname as string) || '';
          if (!newFName && authFullName && !authFullName.includes('@')) {
            newFName = authFullName.trim().split(' ')[0] || '';
          }
        }

        if (!newLName) {
          newLName = (profile?.family_name as string) || (profile?.familyName as string) || '';
          if (!newLName && authFullName && !authFullName.includes('@')) {
            newLName = authFullName.trim().split(' ').slice(1).join(' ') || '';
          }
        }

        return {
          ...prev,
          firstName: newFName,
          lastName: newLName,
          email: validAuthEmail,
        };
      });
    }
  }, [authEmail, authFullName, profile]);

  const handleSeatHoldAndProceed = async (seats: SelectedSeat[], token: string | null = admissionToken): Promise<SeatHoldOutcome> => {
    setSeatStepError(null);
    setIsHoldingSeats(true);
    try {
      const outcome = await createSeatHold(apiFetch, showId as string, seats.map((s) => s.id), token);
      if (outcome.kind === 'created') {
        // Hold acquired: immediately create booking order
        const res = await apiFetch(`${GATEWAY_URL}/api/booking/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': `order-idemp-${outcome.hold.holdId}`,
          },
          body: JSON.stringify({ holdId: outcome.hold.holdId }),
        });

        if (res.ok || res.status === 201 || res.status === 200) {
          const orderData = await res.json();
          const newOrderId = orderData.orderId || orderData.id;
          setActiveOrderId(newOrderId);
          window.history.pushState({}, '', `/checkout/${newOrderId}`);
        } else {
          const err = await res.json().catch(() => null);
          setSeatStepError(err?.detail || err?.title || 'Unable to initialize order checkout.');
          return { kind: 'failed', message: err?.detail || 'Unable to initialize order checkout.' };
        }
      } else if (outcome.kind === 'admission-required') {
        setPendingSeats(seats);
        setIsWaitingRoomOpen(true);
      } else if (outcome.kind === 'seats-unavailable' || outcome.kind === 'failed') {
        setSeatStepError(outcome.message);
      }
      return outcome;
    } catch {
      const msg = 'Network error while holding seats and initializing checkout.';
      setSeatStepError(msg);
      return { kind: 'failed', message: msg };
    } finally {
      setIsHoldingSeats(false);
    }
  };

  const fetchOrderStatus = async () => {
    if (!activeOrderId) return;
    try {
      const res = await fetch(`${BOOKING_API_URL}/api/booking/orders/${activeOrderId}/status`);
      if (res.ok) {
        const data: OrderStatusResponse = await res.json();
        setOrderStatus(data);
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
    }
  };

  const confirmAndRefreshPayment = async () => {
    if (!activeOrderId) return;
    const customerEmail = customerDetails.email.trim();
    const customerName = `${customerDetails.firstName} ${customerDetails.lastName}`.trim();

    console.log('[Checkout Debug] Initiating sandbox payment confirmation for Order ID:', activeOrderId);
    console.log('[Checkout Debug] Dispatching Customer Email:', customerEmail);
    console.log('[Checkout Debug] Dispatching Customer Name:', customerName);

    try {
      console.log('[Checkout Debug] Calling Booking Service endpoint /api/booking/orders/confirm-sandbox...');
      const bookRes = await apiFetch(`${BOOKING_API_URL}/api/booking/orders/${activeOrderId}/confirm-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, customerName })
      });
      console.log('[Checkout Debug] Booking Service response status:', bookRes.status);
    } catch (err) {
      console.warn('[Checkout Debug] Booking service sandbox confirm error:', err);
    }

    try {
      console.log('[Checkout Debug] Calling Payment Service endpoint /api/payment/confirm-sandbox...');
      const payRes = await apiFetch(`${PAYMENT_API_URL}/api/payment/confirm-sandbox/${activeOrderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, customerName })
      });
      console.log('[Checkout Debug] Payment Service response status:', payRes.status);
    } catch (err) {
      console.warn('[Checkout Debug] Payment service sandbox confirm error:', err);
    }

    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${BOOKING_API_URL}/api/booking/orders/${activeOrderId}/status`);
      if (res.ok) {
        const data: OrderStatusResponse = await res.json();
        setOrderStatus(data);
        console.log(`[Checkout Debug] Polled order status (attempt ${i + 1}):`, data.status);
        if (data.status === 'Confirmed') {
          break;
        }
      }
      await new Promise((res) => setTimeout(res, 500));
    }
  };

  const handlePayHereCheckout = async () => {
    if (!activeOrderId) return;
    setIsProcessingPayment(true);
    setValidationError(null);
    const errors: { firstName?: string; lastName?: string; email?: string } = {};

    if (!customerDetails.firstName.trim()) {
      errors.firstName = 'First Name is required.';
    }
    if (!customerDetails.lastName.trim()) {
      errors.lastName = 'Last Name is required.';
    }
    if (!customerDetails.email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!isEmail(customerDetails.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsProcessingPayment(false);
      return;
    }

    setFormErrors({});

    const customerEmail = customerDetails.email.trim();
    const customerName = `${customerDetails.firstName} ${customerDetails.lastName}`.trim();

    try {
      const contactRes = await apiFetch(`${BOOKING_API_URL}/api/booking/orders/${activeOrderId}/contact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, customerName }),
      });
      if (!contactRes.ok) {
        setValidationError('Unable to save your contact details for the ticket email.');
        setIsProcessingPayment(false);
        return;
      }
    } catch (err) {
      console.error('[Checkout Debug] Failed to save customer contact:', err);
      setValidationError('Unable to save your contact details for the ticket email.');
      setIsProcessingPayment(false);
      return;
    }

    if (!payHereParams) {
      setValidationError('Payment parameters not loaded.');
      setIsProcessingPayment(false);
      return;
    }

    if (remainingSeconds !== null && remainingSeconds <= 0) {
      setValidationError('Ticket hold has expired. Payment is disabled.');
      setIsProcessingPayment(false);
      return;
    }

    if (typeof window !== 'undefined' && window.payhere) {
      window.payhere.onCompleted = (completedOrderId: string) => {
        console.log('[Checkout Debug] PayHere payment completed callback triggered for order:', completedOrderId);
        confirmAndRefreshPayment();
      };

      window.payhere.onDismissed = () => {
        console.log('[Checkout Debug] PayHere payment window dismissed');
        setIsProcessingPayment(false);
        fetchOrderStatus();
      };

      window.payhere.onError = (err: string) => {
        console.error('[Checkout Debug] PayHere error:', err);
        setValidationError(`PayHere Error: ${err}`);
        setIsProcessingPayment(false);
      };

      if (!payHereParams.merchantId) {
        setValidationError('PayHere Merchant ID is missing from checkout parameters.');
        setIsProcessingPayment(false);
        return;
      }

      const payment = {
        sandbox: true,
        merchant_id: payHereParams.merchantId,
        return_url: undefined,
        cancel_url: undefined,
        notify_url: payHereParams.notifyUrl,
        order_id: payHereParams.orderId,
        items: payHereParams.items,
        amount: payHereParams.amount.toFixed(2),
        currency: payHereParams.currency,
        hash: payHereParams.hash,
        first_name: customerDetails.firstName.trim(),
        last_name: customerDetails.lastName.trim(),
        email: customerDetails.email.trim(),
        phone: customerDetails.phone,
        address: customerDetails.address,
        city: customerDetails.city,
        country: customerDetails.country,
      };

      console.log('[Checkout Debug] Launching PayHere payment modal with config:', payment);
      window.payhere.startPayment(payment);
    } else {
      console.log('[Checkout Debug] Submitting fallback PayHere form');
      const form = document.getElementById('payhere-checkout-form') as HTMLFormElement;
      if (form) form.submit();
    }
  };

  useEffect(() => {
    if (!activeOrderId) {
      setIsLoading(false);
      return;
    }

    const fetchCheckoutDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const statusRes = await fetch(`${BOOKING_API_URL}/api/booking/orders/${activeOrderId}/status`);
        if (!statusRes.ok) {
          setError('Order not found or has expired.');
          setIsLoading(false);
          return;
        }
        const statusData: OrderStatusResponse = await statusRes.json();
        setOrderStatus(statusData);

        if (statusData.status !== 'Confirmed') {
          let checkoutRes = await apiFetch(`${PAYMENT_API_URL}/api/payment/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: statusData.orderId,
              amount: statusData.totalAmount,
              currency: statusData.currency,
              itemsSummary: `TicketHive Order ${statusData.orderId.slice(0, 8)}`,
            }),
          });

          if (!checkoutRes.ok) {
            checkoutRes = await apiFetch(`${GATEWAY_URL}/api/booking/orders/${activeOrderId}/checkout`);
          }

          if (checkoutRes.ok) {
            const checkoutData: any = await checkoutRes.json();
            console.log('[Checkout Debug] Received checkout params:', checkoutData);
            setPayHereParams({
              merchantId: checkoutData.merchantId || checkoutData.merchant_id,
              orderId: checkoutData.orderId || checkoutData.order_id,
              items: checkoutData.items,
              amount: checkoutData.amount,
              currency: checkoutData.currency,
              hash: checkoutData.hash,
              returnUrl: checkoutData.returnUrl || checkoutData.return_url,
              cancelUrl: checkoutData.cancelUrl || checkoutData.cancel_url,
              notifyUrl: checkoutData.notifyUrl || checkoutData.notify_url,
            });
          } else {
            setError('Unable to load payment parameters.');
          }
        }

        try {
          const orderRes = await apiFetch(`${BOOKING_API_URL}/api/booking/orders/${activeOrderId}`);
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            const eventsRes = await fetch(`${CATALOG_API_URL}/api/catalog/events`);
            if (eventsRes.ok) {
              const eventsData = await eventsRes.json();
              const targetShowId = orderData.showId?.toLowerCase();
              const matchedEvent = eventsData.find((e: any) =>
                e.shows?.some((s: any) => s.id?.toLowerCase() === targetShowId)
              );
              if (matchedEvent) {
                const matchedShow = matchedEvent.shows.find((s: any) => s.id?.toLowerCase() === targetShowId);
                const categoryId = orderData.items?.[0]?.categoryId;
                const cats = matchedShow?.ticketCategories ?? matchedEvent?.ticketCategories ?? [];
                const matchedCategory = cats.find(
                  (c: any) => (c.id || c.categoryId)?.toLowerCase() === categoryId?.toLowerCase()
                );
                setEventDetails({
                  bannerUrl: matchedEvent.coverImageUrl || matchedEvent.coverUrl || matchedEvent.bannerUrl || matchedEvent.imageUrl,
                  posterUrl: matchedEvent.imageUrl || matchedEvent.bannerUrl || matchedEvent.coverImageUrl || matchedEvent.coverUrl,
                  name: matchedEvent.name,
                  date: matchedShow?.showDate,
                  time: matchedShow?.showTime,
                  categoryName: matchedCategory?.name || 'General Admission',
                  categories: cats,
                });
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch event details', e);
        }
      } catch (err) {
        console.error('Error initializing checkout:', err);
        setError('Network error while initializing checkout.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckoutDetails();
  }, [activeOrderId, apiFetch]);

  // Hold Timer calculation (10 minutes)
  useEffect(() => {
    if (!orderStatus || orderStatus.status !== 'PaymentPending') return;

    const expiresAtTime = orderStatus.expiresAt
      ? new Date(orderStatus.expiresAt).getTime()
      : orderStatus.createdAt
        ? new Date(orderStatus.createdAt).getTime() + 10 * 60 * 1000
        : Date.now() + 10 * 60 * 1000;

    const updateTimer = () => {
      const diffSec = Math.floor((expiresAtTime - Date.now()) / 1000);
      if (diffSec <= 0) {
        setRemainingSeconds(0);
      } else {
        setRemainingSeconds(diffSec);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [orderStatus]);

  // Status Polling every 2 seconds while PaymentPending
  useEffect(() => {
    if (!orderStatus || orderStatus.status !== 'PaymentPending') return;

    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [orderStatus?.status, activeOrderId]);

  // Fetch ticket details when Confirmed with polling retry
  useEffect(() => {
    if (orderStatus?.status !== 'Confirmed' || !activeOrderId) return;

    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 10;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const fetchTicket = async () => {
      try {
        let tickets: OrderTicket[] = [];

        // 1. Try order-specific tickets endpoint first
        try {
          const orderTicketsRes = await apiFetch(`${BOOKING_API_URL}/api/booking/orders/${activeOrderId}/tickets`);
          if (orderTicketsRes.ok) {
            const data = await orderTicketsRes.json();
            if (Array.isArray(data) && data.length > 0) {
              tickets = data;
            }
          }
        } catch { /* proceed to fallback */ }

        // 2. Fall back to all customer tickets endpoint
        if (tickets.length === 0) {
          try {
            const allRes = await apiFetch(`${BOOKING_API_URL}/api/booking/tickets`);
            if (allRes.ok) {
              const allData = await allRes.json();
              if (Array.isArray(allData)) {
                tickets = (allData as OrderTicket[]).filter(
                  (t) => (t.orderId || '').toLowerCase() === activeOrderId.toLowerCase()
                );
              }
            }
          } catch { /* ignore network error */ }
        }

        if (!isMounted) return;

        if (tickets.length > 0) {
          setTicketDetails(tickets[0]);
          setOrderTickets(tickets);

          // Populate eventDetails if missing
          if (!eventDetails && tickets[0].showId) {
            try {
              const eventsRes = await fetch(`${CATALOG_API_URL}/api/catalog/events`);
              if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                const targetShowId = (tickets[0].showId as string).toLowerCase();
                const matchedEvent = eventsData.find((e: any) =>
                  e.shows?.some((s: any) => s.id?.toLowerCase() === targetShowId)
                );
                if (matchedEvent) {
                  const matchedShow = matchedEvent.shows.find(
                    (s: any) => s.id?.toLowerCase() === targetShowId
                  );
                  const cats = matchedShow?.ticketCategories ?? matchedEvent?.ticketCategories ?? [];
                  const matchedCategory = cats.find(
                    (c: any) => (c.id || c.categoryId)?.toLowerCase() === (tickets[0].categoryId as string)?.toLowerCase()
                  );
                  setEventDetails({
                    bannerUrl: matchedEvent.coverImageUrl || matchedEvent.coverUrl || matchedEvent.bannerUrl || matchedEvent.imageUrl,
                    posterUrl: matchedEvent.imageUrl || matchedEvent.bannerUrl || matchedEvent.coverImageUrl || matchedEvent.coverUrl,
                    name: matchedEvent.name,
                    date: matchedShow?.showDate,
                    time: matchedShow?.showTime,
                    categoryName: matchedCategory?.name || 'General Admission',
                    categories: cats,
                  });
                }
              }
            } catch (err) {
              console.warn('Failed to load event details for tickets', err);
            }
          }
        } else if (pollCount < maxPolls) {
          pollCount++;
          timerId = setTimeout(fetchTicket, 1000);
        }
      } catch (err) {
        console.warn('Error fetching tickets:', err);
        if (isMounted && pollCount < maxPolls) {
          pollCount++;
          timerId = setTimeout(fetchTicket, 1500);
        }
      }
    };

    fetchTicket();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [orderStatus?.status, activeOrderId, apiFetch, eventDetails]);

  // Auto-redirect countdown on hold expiration
  const isExpiredState =
    orderStatus?.status === 'Failed' ||
    orderStatus?.status === 'Cancelled' ||
    orderStatus?.isExpired ||
    (remainingSeconds !== null && remainingSeconds <= 0);

  useEffect(() => {
    if (!isExpiredState) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNavigateHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExpiredState, onNavigateHome]);

  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-heading font-bold text-lg text-ink-black">Loading Checkout Parameters…</p>
      </div>
    );
  }

  // If there is no activeOrderId yet, render Step 1: Seat Selection (for seated shows)
  if (!activeOrderId) {
    if (showId) {
      return (
        <div className="max-w-7xl mx-auto py-10 px-4 w-full min-h-screen animate-in fade-in duration-200">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => {
                if (showEventData?.event?.id) {
                  window.history.pushState({}, '', `/events/${showEventData.event.id}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                } else if (window.history.length > 1) {
                  window.history.back();
                } else {
                  onNavigateHome();
                }
              }}
              className="inline-flex items-center gap-2 font-body font-bold text-xs md:text-sm text-ink-black bg-brand-white border-2 border-ink-black rounded-full px-4 py-2 hover:bg-surface-yellow cursor-pointer transition-all shadow-[3px_3px_0px_0px_#0A0A0F]"
            >
              <ArrowLeft size={16} />
              <span>Back to Event</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xs uppercase px-3 py-1 bg-brand-blue text-brand-white rounded-full border border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F]">
                Step 1 of 2: Pick Your Seats
              </span>
            </div>
          </div>

          <div className="bg-brand-white border-3 border-ink-black rounded-32 p-6 md:p-8 shadow-[8px_8px_0px_0px_#0A0A0F] mb-8 flex flex-col items-center">
            <div className="mb-6 border-b-2 border-ink-gray-30 pb-4 text-center w-full">
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-ink-black mb-1">
                Select Your Seats
              </h1>
              <p className="font-body text-sm text-ink-gray-70 max-w-2xl mx-auto">
                {showEventData?.event?.name ? `${showEventData.event.name} · ` : ''}
                Choose your preferred seats on the interactive map below to continue to checkout.
              </p>
            </div>

            {seatStepError && (
              <div role="alert" className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 text-[#FF3B3B] font-body font-medium text-sm mb-6 shadow-sm w-full max-w-2xl text-center">
                {seatStepError}
              </div>
            )}

            <div className="w-full max-w-3xl flex flex-col items-center">
              <SeatSelection
                showId={showId}
                categories={seatCategories}
                targetCount={targetCount}
                isAuthenticated={isAuthenticated}
                onLogin={login}
                onHold={(seats) => handleSeatHoldAndProceed(seats)}
                disabled={isHoldingSeats}
              />
            </div>
          </div>

          {showId && (
            <WaitingRoomPopUp
              isOpen={isWaitingRoomOpen}
              showId={showId}
              apiFetch={apiFetch}
              onAdmitted={async (token) => {
                setAdmissionToken(token);
                setIsWaitingRoomOpen(false);
                if (pendingSeats) {
                  const seats = pendingSeats;
                  setPendingSeats(null);
                  await handleSeatHoldAndProceed(seats, token);
                }
              }}
              onClose={() => setIsWaitingRoomOpen(false)}
            />
          )}
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-ink-black flex items-center justify-center text-rose-600 mb-4 shadow-brutal-s">
          <AlertCircle size={36} />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-ink-black mb-2">No Order Specified</h2>
        <p className="font-body text-ink-gray-70 mb-6">Please select an event to start checkout.</p>
        <button
          onClick={onNavigateHome}
          className="bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold px-6 py-3 rounded-full border-2 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Return to Events</span>
        </button>
      </div>
    );
  }

  if (error || !orderStatus) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-ink-black flex items-center justify-center text-rose-600 mb-4 shadow-brutal-s">
          <AlertCircle size={36} />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-ink-black mb-2">Checkout Error</h2>
        <p className="font-body text-ink-gray-70 mb-6">{error || 'Order could not be loaded.'}</p>
        <button
          onClick={onNavigateHome}
          className="bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold px-6 py-3 rounded-full border-2 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Return to Events</span>
        </button>
      </div>
    );
  }

  if (orderStatus.status === 'Cancelled') {
    return <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold">Order cancelled</h1>
      <OrderCancellation orderId={activeOrderId} cancelled />
      <button onClick={onNavigateHome} className="mt-6">Return to events</button>
    </div>;
  }

  if (orderStatus.status === 'Confirmed') {
    return (
      <div className="min-h-[calc(100vh-80px)] w-full flex flex-col animate-in fade-in zoom-in duration-300 max-w-7xl mx-auto items-center justify-center px-6">
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1200px] items-stretch py-10">

          {/* Left Column: Ticket (2/3 width on large screens) */}
          <div className="w-full lg:w-2/3 flex flex-col justify-center">
            {ticketDetails && (
              <div className="flex flex-col gap-8 w-full">
                {(orderTickets.length > 0 ? orderTickets : [ticketDetails]).map((ticket: OrderTicket, index: number, all: OrderTicket[]) => (
                  <Ticket
                    key={ticket.id ?? ticket.uniqueCode ?? index}
                    eventDetails={{
                      name: eventDetails?.name || 'TicketHive Event',
                      date: eventDetails?.date || orderStatus.createdAt || new Date().toISOString(),
                      time: eventDetails?.time || '',
                      bannerUrl: eventDetails?.bannerUrl,
                      posterUrl: eventDetails?.posterUrl,
                      categoryName:
                        (eventDetails?.categories as ShowCategory[] | undefined)?.find(
                          (c) => (c.id || c.categoryId)?.toLowerCase() === (ticket.categoryId ?? '')?.toLowerCase()
                        )?.name ??
                        eventDetails?.categoryName ??
                        'General Admission',
                    }}
                    ticketDetails={{
                      ...ticket,
                      orderId: ticket.orderId || activeOrderId || '',
                      uniqueCode: ticket.uniqueCode || (ticket as any).code || 'TKT',
                      customerName: `${customerDetails.firstName} ${customerDetails.lastName}`.trim() || 'Ticket Holder',
                      // A single ticket shows what was paid for the order; several show their own price.
                      price: all.length === 1 ? orderStatus.totalAmount : ticket.price
                    }}
                  />
                ))}
              </div>
            )}
            {!ticketDetails && (
              <div className="w-full bg-[#F9F9FF] border-2 border-ink-black rounded-24 p-6 text-left flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-brand-blue border-t-transparent animate-spin shrink-0" />
                  <span className="font-heading font-bold text-base text-ink-black">Issuing your tickets...</span>
                </div>
                <p className="font-body text-xs text-ink-gray-70">
                  Please wait a moment while your digital ticket and entry QR code are being generated.
                </p>
                <div className="flex justify-between py-1 text-sm border-t border-ink-gray-30 pt-3">
                  <span className="font-bold text-ink-gray-70">Order Reference:</span>
                  <span className="font-mono text-ink-black font-bold">{(orderStatus.orderId || activeOrderId || '').slice(0, 13)}</span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span className="font-bold text-ink-gray-70">Payment Status:</span>
                  <span className="font-bold text-emerald-600">CONFIRMED</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Success Box (1/3 width on large screens) */}
          <div className="w-full lg:w-1/3 flex flex-col justify-center h-full">
            <div className="bg-brand-white border-3 border-ink-black rounded-[32px] shadow-[8px_8px_0px_0px_#0A0A0F] w-full p-8 flex flex-col items-center text-center h-full">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-3 border-ink-black flex items-center justify-center mb-6 text-emerald-600 shadow-brutal-s shrink-0">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>
              <h2 className="font-heading font-extrabold text-3xl text-ink-black mb-4">
                Payment Successful!
              </h2>
              <p className="font-body text-ink-gray-70 text-sm mb-8 leading-relaxed">
                Your payment of <strong className="text-ink-black font-bold">Rs. {orderStatus.totalAmount.toFixed(2)} {orderStatus.currency}</strong> was processed successfully!
              </p>

              <div className="mt-auto w-full flex flex-col gap-3">
                {activeOrderId && (
                  <OrderCancellation
                    orderId={activeOrderId}
                    cancelled={(orderStatus.status as string) === 'Cancelled'}
                    onCancelled={() => setOrderStatus((prev) => (prev ? { ...prev, status: 'Cancelled' } : null))}
                  />
                )}
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/my-tickets');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-3.5 px-6 rounded-full border-3 border-ink-black shadow-[4px_4px_0px_0px_#0A0A0F] active:shadow-[1px_1px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>View My Tickets 🎟️</span>
                </button>
                <button
                  onClick={onNavigateHome}
                  className="w-full bg-brand-white hover:bg-[#F9F9FF] text-ink-black font-heading font-bold text-sm py-3 px-6 rounded-full border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center"
                >
                  Explore More Events
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (isExpiredState) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-in fade-in zoom-in duration-200">
        <div className="w-20 h-20 rounded-full bg-rose-100 border-3 border-ink-black flex items-center justify-center text-rose-600 mb-6 shadow-brutal-s">
          <AlertCircle size={48} strokeWidth={2.5} />
        </div>
        <h2 className="font-heading font-extrabold text-3xl text-ink-black mb-2">Hold Expired</h2>
        <p className="font-body text-rose-600 font-bold text-base mb-2">Ticket is no longer available.</p>
        <p className="font-body text-ink-gray-70 text-sm mb-6">
          Your 10-minute ticket hold has expired and the reserved tickets have been released back to available inventory.
        </p>

        <div className="bg-amber-50 border-2 border-amber-300 rounded-20 px-4 py-2.5 text-xs font-bold text-amber-900 mb-6 w-full">
          <span>Redirecting to Home in </span>
          <span className="text-amber-700 font-extrabold text-sm">{redirectCountdown}s</span>
        </div>

        <button
          onClick={onNavigateHome}
          className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold px-6 py-3.5 rounded-full border-3 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Return to Events</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 w-full min-h-screen animate-in fade-in duration-200">

      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-ink-black">Complete Your Purchase</h1>
          <p className="font-body text-sm text-ink-gray-70 mt-1">Review details and pay securely via PayHere Gateway</p>
        </div>

        {remainingSeconds !== null && (
          <div className={`flex items-center gap-2 border-2 border-ink-black rounded-full px-4 py-2 text-xs font-bold shadow-brutal-s ${remainingSeconds < 120 ? 'bg-rose-100 text-rose-800 border-rose-900 animate-pulse' : 'bg-amber-100 text-amber-900'
            }`}>
            <span>Hold Expires In:</span>
            <span className="font-mono text-sm font-black">{formatRemainingTime(remainingSeconds)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">

        {/* Left Column: Billing Details */}
        <div className="md:col-span-7 bg-brand-white border-3 border-ink-black rounded-32 p-6 shadow-brutal-s flex flex-col gap-4 h-full">
          <h2 className="font-heading font-extrabold text-xl text-ink-black mb-1">Billing Details</h2>

          {validationError && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-16 p-3 flex items-start gap-2 text-rose-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
              <p className="font-body text-sm font-bold">{validationError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">
                First Name <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                required
                value={customerDetails.firstName}
                onChange={(e) => {
                  setCustomerDetails({ ...customerDetails, firstName: e.target.value });
                  if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: undefined });
                }}
                className={`w-full border-2 rounded-16 px-3 py-3 text-sm font-body focus:outline-none focus:ring-2 ${formErrors.firstName ? 'border-rose-500 bg-rose-50 focus:ring-rose-500' : 'border-ink-black focus:ring-brand-blue'
                  }`}
                placeholder=""
              />
              {formErrors.firstName && (
                <p className="text-rose-600 text-xs mt-1 font-semibold">{formErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">
                Last Name <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <input
                type="text"
                required
                value={customerDetails.lastName}
                onChange={(e) => {
                  setCustomerDetails({ ...customerDetails, lastName: e.target.value });
                  if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: undefined });
                }}
                className={`w-full border-2 rounded-16 px-3 py-3 text-sm font-body focus:outline-none focus:ring-2 ${formErrors.lastName ? 'border-rose-500 bg-rose-50 focus:ring-rose-500' : 'border-ink-black focus:ring-brand-blue'
                  }`}
                placeholder=""
              />
              {formErrors.lastName && (
                <p className="text-rose-600 text-xs mt-1 font-semibold">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-gray-70 mb-1">
              Email Address <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <input
              type="email"
              required
              value={customerDetails.email}
              onChange={(e) => {
                setCustomerDetails({ ...customerDetails, email: e.target.value });
                if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
              }}
              className={`w-full border-2 rounded-16 px-3 py-3 text-sm font-body focus:outline-none focus:ring-2 ${formErrors.email ? 'border-rose-500 bg-rose-50 focus:ring-rose-500' : 'border-ink-black focus:ring-brand-blue'
                }`}
              placeholder="alex.johnson@example.com"
            />
            {formErrors.email && (
              <p className="text-rose-600 text-xs mt-1 font-semibold">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-gray-70 mb-1">Phone Number</label>
            <input
              type="text"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
              className="w-full border-2 border-ink-black rounded-16 px-3 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">Address</label>
              <input
                type="text"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                className="w-full border-2 border-ink-black rounded-16 px-3 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">City</label>
              <input
                type="text"
                value={customerDetails.city}
                onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })}
                className="w-full border-2 border-ink-black rounded-16 px-3 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & PayHere Submit */}
        <div className="md:col-span-5 h-full">
          <div className="bg-[#F9F9FF] border-3 border-ink-black rounded-32 p-6 shadow-brutal-s flex flex-col gap-4 h-full">
            <h2 className="font-heading font-extrabold text-xl text-ink-black pb-3 border-b border-ink-gray-30">
              Order Summary
            </h2>

            {eventDetails && (
              <div className="flex gap-4 items-center mb-4 mt-2">
                {eventDetails.bannerUrl ? (
                  <img src={eventDetails.bannerUrl} alt={eventDetails.name} className="w-[72px] h-[72px] rounded-xl object-cover bg-ink-gray-30 shrink-0" />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-xl bg-[#E2E6FF] shrink-0" />
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-heading font-extrabold text-sm text-ink-black line-clamp-1">{eventDetails.name}</span>
                  <span className="font-body text-[13px] font-medium text-[#7C7C8A]">
                    {new Date(eventDetails.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {eventDetails.time}
                  </span>
                </div>
              </div>
            )}

            {eventDetails && <div className="border-b border-ink-gray-30 mb-2 -mt-2"></div>}

            <div className="flex justify-between items-center text-sm">
              <span className="font-body text-ink-gray-70 font-semibold">Order ID:</span>
              <span className="font-mono text-ink-black font-bold">{activeOrderId}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="font-body text-ink-gray-70 font-semibold">Hold Status:</span>
              <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full text-xs">
                PAYMENT PENDING
              </span>
            </div>

            <div className="flex justify-between items-center text-base pt-3 border-t border-ink-gray-30">
              <span className="font-heading font-extrabold text-ink-black">Total Payable:</span>
              <span className="font-heading font-extrabold text-xl text-brand-blue">
                Rs. {orderStatus.totalAmount.toFixed(2)} {orderStatus.currency}
              </span>
            </div>

            {/* PayHere Sandbox Checkout */}
            {payHereParams && (
              <div className="mt-4">
                <form id="payhere-checkout-form" action="https://sandbox.payhere.lk/pay/checkout" method="post" className="hidden">
                  <input type="hidden" name="merchant_id" value={payHereParams.merchantId} />
                  <input type="hidden" name="return_url" value={payHereParams.returnUrl} />
                  <input type="hidden" name="cancel_url" value={payHereParams.cancelUrl} />
                  <input type="hidden" name="notify_url" value={payHereParams.notifyUrl} />
                  <input type="hidden" name="order_id" value={payHereParams.orderId} />
                  <input type="hidden" name="items" value={payHereParams.items} />
                  <input type="hidden" name="currency" value={payHereParams.currency} />
                  <input type="hidden" name="amount" value={payHereParams.amount.toFixed(2)} />
                  <input type="hidden" name="hash" value={payHereParams.hash} />

                  {/* Billing fields */}
                  <input type="hidden" name="first_name" value={customerDetails.firstName} />
                  <input type="hidden" name="last_name" value={customerDetails.lastName} />
                  <input type="hidden" name="email" value={customerDetails.email} />
                  <input type="hidden" name="phone" value={customerDetails.phone} />
                  <input type="hidden" name="address" value={customerDetails.address} />
                  <input type="hidden" name="city" value={customerDetails.city} />
                  <input type="hidden" name="country" value={customerDetails.country} />
                </form>

                <button
                  type="button"
                  onClick={handlePayHereCheckout}
                  disabled={isProcessingPayment}
                  className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-4 px-6 rounded-full border-3 border-ink-black shadow-[4px_4px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#0A0A0F] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 mb-3 mt-auto disabled:opacity-75 disabled:cursor-wait"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Initializing Payment…</span>
                    </div>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      <span>Pay with PayHere</span>
                    </>
                  )}
                </button>
              </div>
            )}


            <div className="flex items-center justify-center gap-1.5 text-xs text-ink-gray-70 font-body mt-2">
              <Lock size={14} className="text-emerald-600 shrink-0" />
              <span>256-bit Encrypted PayHere Payment Gateway</span>
            </div>
          </div>
        </div>

      </div>

      {/* PayHere Processing Overlay */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-[9999] bg-[#0A0A0F]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 border-4 border-brand-blue border-t-brand-white rounded-full animate-spin shadow-soft-3d mb-6"></div>
          <h3 className="font-heading font-extrabold text-2xl text-brand-white mb-2">Connecting to PayHere</h3>
          <p className="font-body text-ink-gray-30 text-center max-w-sm">Please wait while we prepare your secure checkout. Do not refresh this page.</p>
        </div>
      )}
    </div>
  );
};
