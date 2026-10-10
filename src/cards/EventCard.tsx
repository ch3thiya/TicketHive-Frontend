import React from 'react';

export interface EventCardProps {
  title: string;
  date: string;
  image?: string;
  category?: string;
  emoji?: string;
  venue?: string;
  price?: string;
  // True while the organizer is suspended: the event is visible but cannot be bought.
  salesPaused?: boolean;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  image,
  category,
  emoji,
  salesPaused = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-brand-white border-3 border-ink-black rounded-32 shadow-brutal-m p-0 flex flex-col justify-between overflow-hidden h-[360px] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#0A0A0F] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0px_0px_#0A0A0F] transition-all duration-150 cursor-pointer"
    >
      {/* Top Half: Image Block */}
      <div className="w-full h-[250px] bg-brand-blue-light relative overflow-hidden flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            {emoji ? (
              <span className="text-5xl select-none">{emoji}</span>
            ) : (
              <span className="text-5xl select-none">🎟️</span>
            )}
          </div>
        )}

        {salesPaused && (
          <span className="absolute bottom-4 left-4 z-10 bg-[#FFF7E5] border-[2.5px] border-ink-black text-[#B27A00] font-body font-bold text-[11px] py-1 px-3 rounded-full uppercase tracking-wider select-none shadow-brutal-s">
            Sales paused
          </span>
        )}

        {category && (
          <span className="absolute top-4 left-4 z-10">
            <span className="bg-surface-yellow border-[2.5px] border-ink-black text-ink-black font-body font-bold text-[11px] py-1 px-3 rounded-full uppercase tracking-wider select-none shadow-brutal-s">
              {category}
            </span>
          </span>
        )}
      </div>

      {/* Bottom Half: Title & Date/Time Details */}
      <div className="p-5 bg-brand-white text-left flex flex-col justify-center flex-grow border-t-3 border-ink-black">
        <h3 className="font-heading font-bold text-[18px] text-ink-black leading-snug mb-1 line-clamp-1">
          {title}
        </h3>
        <p className="font-body font-medium text-[14px] text-ink-gray-70 leading-normal">
          {date}
        </p>
      </div>
    </div>
  );
};
