import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CheckCircle2, AlertCircle, CreditCard, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL || '';
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || BOOKING_API_URL;

interface CheckoutPageProps {
  orderId: string;
  onNavigateHome: () => void;
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

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ orderId, onNavigateHome }) => {
  const { apiFetch, email: authEmail, fullName: authFullName, profile } = useAuth();
  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse | null>(null);
  const [payHereParams, setPayHereParams] = useState<PayHereCheckoutParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);

  // Customer billing details prefilled with registered user info
  const [customerDetails, setCustomerDetails] = useState(() => {
    let fName = (profile?.given_name as string) || '';
    let lName = (profile?.family_name as string) || '';

    if (!fName && authFullName) {
      const parts = authFullName.trim().split(' ');
      fName = parts[0] || 'Customer';
      lName = parts.slice(1).join(' ') || 'User';
    }

    return {
      firstName: fName || '',
      lastName: lName || '',
      email: authEmail || (profile?.email as string) || (profile?.sub as string) || 'customer@tickethive.lk',
      phone: '',
      address: '',
      city: '',
      country: 'Sri Lanka',
    };
  });

  // Sync user info if auth profile loads after initial mount
  useEffect(() => {
    if (authEmail || authFullName) {
      setCustomerDetails((prev) => {
        let fName = (profile?.given_name as string) || prev.firstName;
        let lName = (profile?.family_name as string) || prev.lastName;
        if ((!profile?.given_name && authFullName) && prev.firstName === 'Customer') {
          const parts = authFullName.trim().split(' ');
          fName = parts[0] || 'Customer';
          lName = parts.slice(1).join(' ') || 'User';
        }
        return {
          ...prev,
          firstName: fName,
          lastName: lName,
          email: authEmail || prev.email,
        };
      });
    }
  }, [authEmail, authFullName, profile]);

  const fetchOrderStatus = async () => {
    try {
      const res = await fetch(`${BOOKING_API_URL}/api/booking/orders/${orderId}/status`);
      if (res.ok) {
        const data: OrderStatusResponse = await res.json();
        setOrderStatus(data);
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
    }
  };

  const confirmAndRefreshPayment = async () => {
    const customerEmail = customerDetails.email;
    const customerName = `${customerDetails.firstName} ${customerDetails.lastName}`.trim();

    try {
      await apiFetch(`${PAYMENT_API_URL}/api/payment/confirm-sandbox/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, customerName })
      });
    } catch (err) {
      console.warn('Payment service sandbox confirm error:', err);
    }

    try {
      await apiFetch(`${BOOKING_API_URL}/api/booking/orders/${orderId}/confirm-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail, customerName })
      });
    } catch (err) {
      console.warn('Booking service sandbox confirm error:', err);
    }

    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${BOOKING_API_URL}/api/booking/orders/${orderId}/status`);
      if (res.ok) {
        const data: OrderStatusResponse = await res.json();
        setOrderStatus(data);
        if (data.status === 'Confirmed') {
          break;
        }
      }
      await new Promise((res) => setTimeout(res, 500));
    }
  };

  const handlePayHereCheckout = () => {
    if (!payHereParams) {
      setError('Payment parameters not loaded.');
      return;
    }

    if (remainingSeconds !== null && remainingSeconds <= 0) {
      setError('Ticket hold has expired. Payment is disabled.');
      return;
    }

    if (typeof window !== 'undefined' && window.payhere) {
      window.payhere.onCompleted = (completedOrderId: string) => {
        console.log('PayHere payment completed for order:', completedOrderId);
        confirmAndRefreshPayment();
      };

      window.payhere.onDismissed = () => {
        console.log('PayHere payment window dismissed');
        fetchOrderStatus();
      };

      window.payhere.onError = (err: string) => {
        console.error('PayHere error:', err);
        setError(`PayHere Error: ${err}`);
      };

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
        first_name: customerDetails.firstName,
        last_name: customerDetails.lastName,
        email: customerDetails.email,
        phone: customerDetails.phone,
        address: customerDetails.address,
        city: customerDetails.city,
        country: customerDetails.country,
      };

      window.payhere.startPayment(payment);
    } else {
      const form = document.getElementById('payhere-checkout-form') as HTMLFormElement;
      if (form) form.submit();
    }
  };

  useEffect(() => {
    const fetchCheckoutDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const statusRes = await fetch(`${BOOKING_API_URL}/api/booking/orders/${orderId}/status`);
        if (!statusRes.ok) {
          setError('Order not found or has expired.');
          setIsLoading(false);
          return;
        }
        const statusData: OrderStatusResponse = await statusRes.json();
        setOrderStatus(statusData);

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
          checkoutRes = await apiFetch(`/api/booking/orders/${orderId}/checkout`);
        }

        if (checkoutRes.ok) {
          const checkoutData: PayHereCheckoutParams = await checkoutRes.json();
          setPayHereParams(checkoutData);
        } else {
          setError('Unable to load payment parameters.');
        }
      } catch (err) {
        console.error('Error initializing checkout:', err);
        setError('Network error while initializing checkout.');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchCheckoutDetails();
    }
  }, [orderId, apiFetch]);

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
  }, [orderStatus?.status, orderId]);

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

  if (orderStatus.status === 'Confirmed') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="bg-brand-white border-3 border-ink-black rounded-[32px] shadow-soft-3d w-full max-w-[500px] p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-3 border-ink-black flex items-center justify-center mb-6 text-emerald-600 shadow-brutal-s">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h2 className="font-heading font-extrabold text-3xl text-ink-black mb-2">
            Payment Successful!
          </h2>
          <p className="font-body text-ink-gray-70 text-sm mb-6 max-w-sm">
            Your payment of <strong className="text-ink-black font-bold">Rs. {orderStatus.totalAmount.toFixed(2)} {orderStatus.currency}</strong> was processed successfully and your e-tickets have been issued!
          </p>
          <div className="w-full bg-[#F9F9FF] border-2 border-ink-black rounded-24 p-4 mb-6 text-left">
            <div className="flex justify-between py-1 text-sm border-b border-ink-gray-30">
              <span className="font-bold text-ink-gray-70">Order Reference:</span>
              <span className="font-mono text-ink-black font-bold">{orderStatus.orderId.slice(0, 13)}…</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="font-bold text-ink-gray-70">Status:</span>
              <span className="font-bold text-emerald-600">CONFIRMED & ISSUED</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              window.history.pushState({}, '', '/my-tickets');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-3.5 px-6 rounded-full border-3 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer mb-3 flex items-center justify-center gap-2"
          >
            <span>View My Tickets 🎟️</span>
          </button>
          
          <button
            onClick={onNavigateHome}
            className="w-full bg-brand-white hover:bg-[#F9F9FF] text-ink-black font-heading font-bold text-sm py-2.5 px-6 rounded-full border-2 border-ink-black shadow-[2px_2px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Explore More Events
          </button>
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
    <div className="max-w-7xl mx-auto px-6 py-10 w-full min-h-screen animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-ink-black flex-wrap gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-ink-black">Complete Your Purchase</h1>
          <p className="font-body text-sm text-ink-gray-70 mt-1">Review details and pay securely via PayHere Gateway</p>
        </div>
        
        {remainingSeconds !== null && (
          <div className={`flex items-center gap-2 border-2 border-ink-black rounded-full px-4 py-2 text-xs font-bold shadow-brutal-s ${
            remainingSeconds < 120 ? 'bg-rose-100 text-rose-800 border-rose-900 animate-pulse' : 'bg-amber-100 text-amber-900'
          }`}>
            <span className="text-base">⏱️</span>
            <span>Hold Expires In:</span>
            <span className="font-mono text-sm font-black">{formatRemainingTime(remainingSeconds)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Billing Details */}
        <div className="md:col-span-7 bg-brand-white border-3 border-ink-black rounded-32 p-6 shadow-brutal-s flex flex-col gap-4">
          <h2 className="font-heading font-extrabold text-xl text-ink-black mb-1">Billing Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">First Name</label>
              <input
                type="text"
                value={customerDetails.firstName}
                onChange={(e) => setCustomerDetails({ ...customerDetails, firstName: e.target.value })}
                className="w-full border-2 border-ink-black rounded-16 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">Last Name</label>
              <input
                type="text"
                value={customerDetails.lastName}
                onChange={(e) => setCustomerDetails({ ...customerDetails, lastName: e.target.value })}
                className="w-full border-2 border-ink-black rounded-16 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-gray-70 mb-1">Email Address</label>
            <input
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
              className="w-full border-2 border-ink-black rounded-16 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-gray-70 mb-1">Phone Number</label>
            <input
              type="text"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
              className="w-full border-2 border-ink-black rounded-16 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">Address</label>
              <input
                type="text"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                className="w-full border-2 border-ink-black rounded-16 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-gray-70 mb-1">City</label>
              <input
                type="text"
                value={customerDetails.city}
                onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })}
                className="w-full border-2 border-ink-black rounded-16 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & PayHere Submit */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-[#F9F9FF] border-3 border-ink-black rounded-32 p-6 shadow-brutal-s flex flex-col gap-4">
            <h2 className="font-heading font-extrabold text-xl text-ink-black pb-3 border-b border-ink-gray-30">
              Order Summary
            </h2>
            
            <div className="flex justify-between items-center text-sm">
              <span className="font-body text-ink-gray-70 font-semibold">Order ID:</span>
              <span className="font-mono text-ink-black font-bold">{orderId.slice(0, 8)}…</span>
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
                  className="w-full bg-brand-blue hover:bg-[#15155E] text-brand-white font-heading font-bold text-base py-4 px-6 rounded-full border-3 border-ink-black shadow-[4px_4px_0px_0px_#0A0A0F] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#0A0A0F] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 mb-3"
                >
                  <CreditCard size={20} />
                  <span>Pay with PayHere</span>
                </button>
              </div>
            )}


            <div className="flex items-center justify-center gap-1.5 text-xs text-ink-gray-70 font-body mt-2">
              <Lock size={14} className="text-emerald-600" />
              <span>256-bit Encrypted PayHere Payment Gateway</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
