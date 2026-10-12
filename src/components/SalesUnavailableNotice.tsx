import React from 'react';

export const SalesUnavailableNotice: React.FC = () => (
  <div
    role="status"
    className="bg-[#FFF7E5] border-3 border-ink-black rounded-20 p-5 mb-6 shadow-brutal-s"
  >
    <p className="font-heading font-bold text-[18px] text-[#B27A00] mb-1">Ticket sales are unavailable</p>
    <p className="font-body text-[14px] text-ink-black leading-relaxed">
      Tickets for this event cannot be bought right now. If you already have tickets, they are
      still valid. Please check back later.
    </p>
  </div>
);