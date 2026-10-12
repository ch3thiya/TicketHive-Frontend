import React from 'react';

export const SuspendedOrganizerBanner: React.FC = () => (
  <div
    role="status"
    className="bg-[#FFEBEB] border-3 border-ink-black rounded-20 p-5 mb-6 shadow-brutal-s"
  >
    <p className="font-heading font-bold text-[18px] text-[#D32F2F] mb-1">Your account is suspended</p>
    <p className="font-body text-[14px] text-ink-black leading-relaxed">
      You can still view your events, but you cannot create, edit, publish or cancel events and
      shows, and ticket sales are paused. Tickets already sold stay valid and nothing has been
      cancelled or refunded. Contact a TicketHive administrator to find out more.
    </p>
  </div>
);