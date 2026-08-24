import React from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface Event {
  id: number;
  title: string;
  category: string;
  price: string;
  date: string;
  venue: string;
  emoji: string;
}

const FEATURED_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Neon Nights Tour 2026',
    category: 'Concerts',
    price: '$80.00',
    date: 'Aug 28, 2026',
    venue: 'Wembley Stadium',
    emoji: '🎸',
  },
  {
    id: 2,
    title: 'Championship Finals',
    category: 'Sports',
    price: '$120.00',
    date: 'Sep 04, 2026',
    venue: 'MetLife Stadium',
    emoji: '⚽',
  },
  {
    id: 3,
    title: 'Retro Cinema Festival',
    category: 'Movies',
    price: '$15.00',
    date: 'Sep 12, 2026',
    venue: 'The Roxy Theatre',
    emoji: '🎬',
  },
];

export const Home: React.FC = () => {
  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="bg-brand-blue-light/20 py-20 px-6 border-b-3 border-ink-black text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 flex flex-col items-start gap-4">
            <Badge variant="yellow" uppercase={true}>
              Live Events & Concerts
            </Badge>
            <h1 className="font-heading font-extrabold text-[44px] md:text-[56px] text-ink-black leading-tight text-left">
              Find tickets to your next core memory <span className="select-none text-brand-blue">⚡</span>
            </h1>
            <p className="font-body text-[16px] md:text-[18px] text-ink-gray-70 max-w-xl text-left leading-relaxed">
              Discover concerts, movies, sports, and more on the ultimate ticket platform. Secure your spot in seconds.
            </p>
            <div className="flex gap-4 mt-2">
              <Button variant="primary" size="L" onClick={() => alert('Explore Events clicked!')}>
                Explore Events
              </Button>
              <Button variant="outline" size="L" onClick={() => alert('Learn More clicked!')}>
                How it works
              </Button>
            </div>
          </div>
          {/* Hero Decorative Illustration (Neo-Brutalist Soft-3D ticket) */}
          <div className="flex-shrink-0 w-full max-w-[380px] bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d p-8 relative rotate-3 hover:rotate-0 transition-transform duration-300">
            <div className="bg-brand-blue text-brand-white p-6 rounded-20 border-3 border-ink-black text-center relative overflow-hidden">
              <span className="text-4xl absolute -right-2 -bottom-2 opacity-20 select-none">🎟️</span>
              <span className="font-heading font-bold text-xs tracking-widest text-brand-white/80 uppercase">
                Vip Pass Admission
              </span>
              <h3 className="font-heading font-extrabold text-2xl mt-2 leading-none">
                TicketHive Pass
              </h3>
            </div>
            <div className="flex justify-between items-center mt-6">
              <div>
                <span className="text-xs font-semibold text-ink-gray-70 font-body uppercase">Global Price</span>
                <p className="font-heading font-extrabold text-2xl text-brand-blue mt-0.5">$240.97</p>
              </div>
              <Badge variant="success" uppercase={true}>
                Active
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <Badge variant="active" uppercase={true}>
              Trending Now
            </Badge>
            <h2 className="font-heading font-bold text-[32px] md:text-[40px] text-ink-black mt-2 leading-tight">
              Popular Events
            </h2>
          </div>
          <button
            onClick={() => alert('View All clicked!')}
            className="font-body font-semibold text-[15px] text-brand-blue underline hover:opacity-80 cursor-pointer"
          >
            View All Events
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURED_EVENTS.map((event) => (
            <div
              key={event.id}
              className="bg-brand-white border-3 border-ink-black rounded-24 shadow-soft-3d p-6 flex flex-col justify-between h-[420px] transition-transform duration-150 hover:-translate-y-1"
            >
              <div>
                {/* Event Image Placeholder (Section 7) */}
                <div className="bg-brand-blue-light h-[160px] rounded-16 border-2.5 border-ink-black flex items-center justify-center relative overflow-hidden mb-5">
                  <span className="text-5xl select-none">{event.emoji}</span>
                  <span className="absolute top-3 left-3">
                    <Badge variant="yellow" uppercase={true}>
                      {event.category}
                    </Badge>
                  </span>
                </div>
                
                <h3 className="font-heading font-bold text-[22px] text-ink-black leading-snug mb-1">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1.5 text-ink-gray-70 font-body text-xs mt-1">
                  <span>📅 {event.date}</span>
                  <span>•</span>
                  <span>📍 {event.venue}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <span className="text-[11px] font-semibold text-ink-gray-70 font-body uppercase">Price</span>
                  <p className="font-heading font-extrabold text-[22px] text-brand-blue mt-0.5">{event.price}</p>
                </div>
                <Button
                  variant="outline"
                  size="M"
                  shadow="S"
                  onClick={() => alert(`Purchase flow for "${event.title}" started!`)}
                >
                  Buy Tickets
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
