import React from 'react';

export interface EventCardProps {
  title: string;
  date: string;
  image?: string;
  category?: string;
  emoji?: string;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  image,
  category,
  emoji,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-brand-white border-3 border-ink-black rounded-28 shadow-brutal-m p-0 flex flex-col justify-between overflow-hidden h-[360px] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#0A0A0F] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0px_0px_#0A0A0F] transition-all duration-150 cursor-pointer"
    >
      {/* Top Half: Image Block */}
      <div className="w-full h-[220px] bg-brand-blue-light relative overflow-hidden border-b-3 border-ink-black flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            {emoji && <span className="text-5xl select-none">{emoji}</span>}
          </div>
        )}

        {category && (
          <span className="absolute top-4 left-4">
            <span className="bg-surface-yellow border-[2.5px] border-ink-black text-ink-black font-body font-bold text-[11px] py-1 px-3 rounded-full uppercase tracking-wider select-none">
              {category}
            </span>
          </span>
        )}
      </div>

      {/* Bottom Half: Text Details */}
      <div className="p-5 flex-grow flex flex-col justify-center bg-brand-white">
        <h3 className="font-body font-bold text-[16px] text-ink-black leading-tight mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="font-body text-[13px] text-ink-gray-70 leading-none">
          {date}
        </p>
      </div>
      
    </div>
  );
};
