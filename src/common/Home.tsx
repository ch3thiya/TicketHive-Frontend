import React from 'react';
import { EventCard } from '../cards/EventCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface EventItem {
  id: number;
  title: string;
  category: string;
  date: string;
  emoji: string;
  imageUrl: string;
}

const MOVIES: EventItem[] = [
  {
    id: 1,
    title: 'Dune: Part Three',
    category: 'Movies',
    date: 'Fri, Sep 4',
    emoji: '🎬',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400',
  },
  {
    id: 2,
    title: 'The Batman II',
    category: 'Movies',
    date: 'Sat, Sep 5',
    emoji: '🎬',
    imageUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=400',
  },
  {
    id: 3,
    title: 'Wicked: Part 2',
    category: 'Movies',
    date: 'Sun, Sep 6',
    emoji: '🎬',
    imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=400',
  },
  {
    id: 4,
    title: 'Avatar 4',
    category: 'Movies',
    date: 'Wed, Sep 9',
    emoji: '🎬',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400',
  },
  {
    id: 5,
    title: 'Mission Impossible 9',
    category: 'Movies',
    date: 'Thu, Sep 10',
    emoji: '🎬',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400',
  },
];

const CONCERTS: EventItem[] = [
  {
    id: 6,
    title: 'Coldplay World Tour',
    category: 'Concerts',
    date: 'Mon, Sep 14',
    emoji: '🎤',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400',
  },
  {
    id: 7,
    title: "Taylor's Version Live",
    category: 'Concerts',
    date: 'Tue, Sep 15',
    emoji: '🎤',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400',
  },
  {
    id: 8,
    title: 'Weeknd After Hours',
    category: 'Concerts',
    date: 'Fri, Sep 18',
    emoji: '🎤',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400',
  },
  {
    id: 9,
    title: 'Billie Eilish Live',
    category: 'Concerts',
    date: 'Sat, Sep 19',
    emoji: '🎤',
    imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400',
  },
  {
    id: 10,
    title: 'Bruno Mars Tour',
    category: 'Concerts',
    date: 'Sun, Sep 20',
    emoji: '🎤',
    imageUrl: 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=400',
  },
];

const SPORTS: EventItem[] = [
  {
    id: 11,
    title: 'Lakers vs Celtics',
    category: 'Sports',
    date: 'Sat, Sep 12',
    emoji: '🏆',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=400',
  },
  {
    id: 12,
    title: 'Real Madrid vs Barca',
    category: 'Sports',
    date: 'Sun, Sep 13',
    emoji: '🏆',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400',
  },
  {
    id: 13,
    title: 'Yankees vs Red Sox',
    category: 'Sports',
    date: 'Mon, Sep 14',
    emoji: '🏆',
    imageUrl: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=400',
  },
  {
    id: 14,
    title: 'Chiefs vs Eagles',
    category: 'Sports',
    date: 'Sun, Sep 20',
    emoji: '🏆',
    imageUrl: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=400',
  },
  {
    id: 15,
    title: 'Wimbledon Finals',
    category: 'Sports',
    date: 'Sat, Sep 26',
    emoji: '🏆',
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=400',
  },
];

export const Home: React.FC = () => {
  return (
    <div className="w-full flex flex-col bg-brand-white">
      
      {/* Hero Banner - stretch full screen width */}
      <section className="bg-brand-blue text-brand-white py-16 px-6 border-b-3 border-ink-black w-full">
        <div className="max-w-7xl mx-auto flex flex-col items-start gap-4">
          <Badge variant="yellow" uppercase={true}>
            🔥 Trending Now
          </Badge>
          <h1 className="font-heading font-extrabold text-[40px] md:text-[52px] text-brand-white leading-none mt-2">
            Arijit Singh — Live in Concert
          </h1>
          <p className="font-body text-[16px] md:text-[18px] text-brand-white/90">
            Madison Square Garden • Sat, Sep 12
          </p>
          <Button
            variant="secondary"
            size="L"
            shadow="M"
            onClick={() => alert('Starting checkout for Arijit Singh!')}
            className="mt-2"
          >
            Get Tickets
          </Button>
        </div>
      </section>

      {/* Main Categories Section - constrained to 7xl */}
      <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col gap-16 w-full">
        
        {/* Row 1: Trending Movies */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading font-bold text-[24px] text-ink-black flex items-center gap-2">
            <span className="select-none">🎬</span> Trending Movies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {MOVIES.map((movie) => (
              <EventCard
                key={movie.id}
                title={movie.title}
                date={movie.date}
                image={movie.imageUrl}
                onClick={() => alert(`Selected movie: ${movie.title}`)}
              />
            ))}
          </div>
        </section>

        {/* Row 2: Upcoming Concerts */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading font-bold text-[24px] text-ink-black flex items-center gap-2">
            <span className="select-none">🎤</span> Upcoming Concerts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {CONCERTS.map((concert) => (
              <EventCard
                key={concert.id}
                title={concert.title}
                date={concert.date}
                image={concert.imageUrl}
                onClick={() => alert(`Selected concert: ${concert.title}`)}
              />
            ))}
          </div>
        </section>

        {/* Row 3: Live Sports */}
        <section className="flex flex-col gap-6 font-heading">
          <h2 className="font-heading font-bold text-[24px] text-ink-black flex items-center gap-2">
            <span className="select-none">🏆</span> Live Sports
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {SPORTS.map((sport) => (
              <EventCard
                key={sport.id}
                title={sport.title}
                date={sport.date}
                image={sport.imageUrl}
                onClick={() => alert(`Selected sport match: ${sport.title}`)}
              />
            ))}
          </div>
        </section>

      </div>

    </div>
  );
};
