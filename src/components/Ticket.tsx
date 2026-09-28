import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketProps {
  eventDetails: {
    name: string;
    date: string;
    time: string;
    categoryName: string;
    bannerUrl?: string;
    posterUrl?: string;
  };
  ticketDetails: {
    uniqueCode: string;
    price: number;
    customerName?: string;
    orderId: string;
  };
}

export const Ticket: React.FC<TicketProps> = ({ eventDetails, ticketDetails }) => {
  return (
    <div className="w-full h-full flex bg-[#FDFDFF] border-3 border-ink-black rounded-[32px] overflow-hidden shadow-[8px_8px_0px_0px_#0A0A0F] relative isolate">
      {/* Background Poster Blur Overlay */}
      {eventDetails.posterUrl && (
        <div className="absolute inset-0 z-[-1] opacity-5">
          <img src={eventDetails.posterUrl} alt="Background" className="w-full h-full object-cover blur-md" />
        </div>
      )}

      {/* Main Ticket Body (Left 2/3) */}
      <div className="flex-1 flex flex-col p-6 sm:p-8 relative">
        <div className="flex items-center gap-4 sm:gap-6 mb-6">
          {(eventDetails.posterUrl || eventDetails.bannerUrl) && (
            <img 
              src={eventDetails.posterUrl || eventDetails.bannerUrl} 
              alt="Event" 
              className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-2xl border-3 border-ink-black shadow-[4px_4px_0px_0px_#0A0A0F] shrink-0" 
            />
          )}
          <div className="flex flex-col gap-1">
            <span className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-ink-black uppercase tracking-tight leading-none line-clamp-2">
              {eventDetails.name}
            </span>
            <span className="font-body text-xs sm:text-sm font-bold text-brand-blue uppercase tracking-widest mt-1 sm:mt-2">
              {eventDetails.categoryName}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="flex flex-col">
            <span className="font-body text-[10px] font-bold text-ink-gray-70 uppercase tracking-widest mb-1">Date & Time</span>
            <span className="font-heading font-bold text-lg text-ink-black">
              {new Date(eventDetails.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}<br />
              {eventDetails.time}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-body text-[10px] font-bold text-ink-gray-70 uppercase tracking-widest mb-1">Admit</span>
            <span className="font-heading font-bold text-lg text-ink-black uppercase">
              1 Person
            </span>
          </div>
          <div className="flex flex-col mt-4">
            <span className="font-body text-[10px] font-bold text-ink-gray-70 uppercase tracking-widest mb-1">Ticket ID</span>
            <span className="font-mono font-bold text-base text-ink-black">
              {ticketDetails.uniqueCode}
            </span>
          </div>
          <div className="flex flex-col mt-4">
            <span className="font-body text-[10px] font-bold text-ink-gray-70 uppercase tracking-widest mb-1">Order Ref</span>
            <span className="font-mono font-bold text-base text-ink-black">
              {ticketDetails.orderId.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="w-1 border-l-4 border-dashed border-ink-gray-30 relative my-6">
        <div className="absolute -top-10 -left-4 w-8 h-8 bg-brand-white border-b-3 border-r-3 border-l-3 border-ink-black rounded-b-full"></div>
        <div className="absolute -bottom-10 -left-4 w-8 h-8 bg-brand-white border-t-3 border-r-3 border-l-3 border-ink-black rounded-t-full"></div>
      </div>

      {/* Ticket Stub / QR Code (Right 1/3) */}
      <div className="w-[180px] sm:w-[220px] bg-brand-blue-light/30 flex flex-col items-center justify-center p-6 shrink-0 relative">

        <div className="bg-white p-3 rounded-16 border-3 border-ink-black shadow-brutal-s flex items-center justify-center">
          <QRCodeSVG value={`${window.location.origin}/?validate=${ticketDetails.uniqueCode}`} size={120} level="H" />
        </div>
      </div>
    </div>
  );
};
