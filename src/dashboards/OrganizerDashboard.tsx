import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Calendar, MapPin, Plus, Trash2, Upload } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

// Mock ticket category type
interface TicketCategory {
  name: string;
  price: string;
  quantity: string;
}

// Initial mock events list to make dashboard feel live
const INITIAL_EVENTS = [
  { id: 1, name: 'Neon Summer Festival', date: 'Sep 15, 2026', time: '6:00 PM', venue: 'SoFi Stadium', category: 'Concert', status: 'Active', ticketsSold: '1,420 / 3,000' },
  { id: 2, name: 'Retro Jazz Nights', date: 'Oct 02, 2026', time: '8:00 PM', venue: 'Madison Square Garden', category: 'Concert', status: 'Draft', ticketsSold: '0 / 500' }
];

export const OrganizerDashboard: React.FC = () => {
  const { isAuthenticated, role, logout } = useAuth();
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<TicketCategory[]>([
    { name: 'General Admission', price: '85', quantity: '1500' },
    { name: 'VIP Standing', price: '180', quantity: '200' },
    { name: 'Premium Balcony', price: '250', quantity: '60' }
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategoryRow = () => {
    setCategories(prev => [...prev, { name: '', price: '', quantity: '' }]);
  };

  const handleRemoveCategoryRow = (idx: number) => {
    setCategories(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCategoryChange = (idx: number, field: keyof TicketCategory, val: string) => {
    setCategories(prev => prev.map((cat, i) => i === idx ? { ...cat, [field]: val } : cat));
  };

  const handlePublishEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventDate || !eventVenue) {
      alert('Event Name, Date, and Venue are required.');
      return;
    }

    const newEvent = {
      id: Date.now(),
      name: eventName,
      date: eventDate,
      time: eventTime || 'TBA',
      venue: eventVenue,
      category: eventCategory || 'General',
      status: 'Active',
      ticketsSold: `0 / ${categories.reduce((acc, cat) => acc + (parseInt(cat.quantity) || 0), 0)}`
    };

    setEvents(prev => [...prev, newEvent]);
    setIsAddEventOpen(false);

    // Reset fields
    setEventName('');
    setEventDate('');
    setEventTime('');
    setEventVenue('');
    setEventCategory('');
    setEventDesc('');
    setEventImage(null);
    setCategories([
      { name: 'General Admission', price: '85', quantity: '1500' }
    ]);
  };

  const goBackToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isAuthenticated || role !== 'organizer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-white p-6 text-center">
        <h2 className="font-heading font-bold text-2xl text-ink-black mb-2">Access Denied</h2>
        <p className="font-body text-ink-gray-70 mb-4">Only registered event organizers can view this dashboard.</p>
        <button
          onClick={goBackToHome}
          className="font-body font-bold bg-brand-blue text-brand-white px-6 py-2.5 rounded-full border-3 border-ink-black shadow-brutal-s hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all active:translate-y-px"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FC] flex flex-col font-body">
      
      {/* 1. Organizer Navbar */}
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

      {/* 2. Content Canvas */}
      <main className="flex-grow max-w-8xl w-full mx-auto px-6 py-8">
        
        {/* Dashboard Title & CTA */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-[32px] text-ink-black leading-none">
            My Events Overview
          </h1>
          <button
            onClick={() => setIsAddEventOpen(true)}
            className="font-body font-bold text-[13px] text-ink-black bg-[#FFE94D] border-2.5 border-ink-black rounded-full px-5 py-2.5 hover:bg-[#F3DC3C] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F] flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Create Event</span>
          </button>
        </div>

        {/* Events Grid */}
        <div className="bg-brand-white border-3 border-ink-black rounded-28 p-8 shadow-soft-3d">
          <h2 className="font-heading font-bold text-[20px] text-ink-black mb-6">
            Active Events & Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => (
              <div 
                key={evt.id}
                className="bg-[#F9F9FC] border-2.5 border-ink-black rounded-20 p-6 flex flex-col gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="bg-brand-blue-light text-brand-blue text-[11px] font-bold px-3 py-1 rounded-full border-1.5 border-ink-black">
                      {evt.category}
                    </span>
                    <span className={`text-[12px] font-bold px-3 py-0.5 rounded-full border border-ink-black ${
                      evt.status === 'Active' ? 'bg-[#00C875]/20 text-[#00B074]' : 'bg-ink-gray-30 text-ink-gray-70'
                    }`}>
                      {evt.status}
                    </span>
                  </div>
                  
                  <h3 className="font-heading font-bold text-[20px] text-ink-black mt-2 mb-1.5">
                    {evt.name}
                  </h3>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-b border-ink-gray-30 py-3">
                  <div className="flex items-center gap-2 text-[13px] text-ink-gray-70">
                    <Calendar size={14} className="shrink-0" />
                    <span>{evt.date} · {evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-ink-gray-70">
                    <MapPin size={14} className="shrink-0" />
                    <span>{evt.venue}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[13px] font-bold">
                  <span className="text-ink-gray-70 font-medium">Tickets Issued/Sold</span>
                  <span className="text-brand-blue">{evt.ticketsSold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* 3. Add Event Popup Modal with Dark Overlay */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          
          <div className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[640px] my-8 p-8 flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Close Button */}
            <button
              onClick={() => setIsAddEventOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light active:translate-y-px active:translate-x-px transition-all outline-none"
            >
              <span className="font-body font-bold text-sm text-ink-black select-none">✕</span>
            </button>

            {/* Modal Title */}
            <h2 className="font-heading font-bold text-[24px] text-ink-black mb-5 border-b border-ink-gray-30 pb-2">
              Create New Event
            </h2>

            <form onSubmit={handlePublishEvent} className="flex flex-col gap-6">
              
              {/* Event Details Section */}
              <div className="flex flex-col gap-4">
                <h3 className="font-body font-bold text-[15px] text-ink-black">Event Details</h3>
                
                <div className="flex flex-col gap-2 w-full text-left">
                  <label className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
                    Event Banner
                  </label>
                  
                  {eventImage ? (
                    <div className="relative w-full aspect-[21/9] rounded-20 border-3 border-ink-black overflow-hidden shadow-brutal-s group">
                      <img 
                        src={eventImage} 
                        alt="Event Banner Preview" 
                        className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setEventImage(null)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full border-2 border-ink-black bg-brand-white text-[#FF3B3B] flex items-center justify-center cursor-pointer hover:bg-red-50 transition-all shadow-sm font-bold text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="border-3 border-dashed border-ink-gray-30 bg-[#F9F9FC] rounded-20 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-blue-light/35 hover:border-brand-blue transition-all group select-none min-h-[140px]">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                      <div className="w-12 h-12 rounded-full border-2 border-ink-black flex items-center justify-center bg-brand-white shadow-[2px_2px_0px_0px_#0A0A0F] mb-3 group-hover:scale-105 transition-transform">
                        <Upload size={18} strokeWidth={2.5} className="text-brand-blue" />
                      </div>
                      <span className="font-body font-bold text-[14px] text-ink-black">
                        Upload banner image
                      </span>
                      <span className="font-body text-[12px] text-ink-gray-70 mt-1">
                        PNG, JPG or WEBP up to 5MB
                      </span>
                    </label>
                  )}
                </div>

                <Input
                  label="Event Name"
                  type="text"
                  placeholder="e.g. Arijit Singh — Live in Concert"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />

                <div className="flex gap-4 w-full flex-col sm:flex-row">
                  <Input
                    label="Date"
                    type="text"
                    placeholder="Sep 12, 2026"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Input
                    label="Time"
                    type="text"
                    placeholder="7:00 PM"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="flex flex-col gap-2 w-full text-left">
                  <label className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]">
                    Venue
                  </label>
                  <select
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    required
                    className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 px-4 w-full outline-none focus:border-brand-blue focus:shadow-brutal-s cursor-pointer"
                  >
                    <option value="">Select a venue...</option>
                    <option value="Madison Square Garden">Madison Square Garden</option>
                    <option value="SoFi Stadium">SoFi Stadium</option>
                    <option value="Crypto.com Arena">Crypto.com Arena</option>
                    <option value="Red Rocks Amphitheatre">Red Rocks Amphitheatre</option>
                    <option value="United Center">United Center</option>
                    <option value="Fenway Park">Fenway Park</option>
                  </select>
                </div>

                <Input
                  label="Category"
                  type="text"
                  placeholder="Concert, Movie, or Sport"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                />

                <Input
                  label="Description"
                  type="textarea"
                  placeholder="Tell customers what to expect..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                />
              </div>

              <hr className="border-ink-gray-30" />

              {/* Ticket Categories & Pricing Section */}
              <div className="flex flex-col gap-4">
                <h3 className="font-body font-bold text-[15px] text-ink-black">Ticket Categories & Pricing</h3>
                
                <div className="flex flex-col gap-3">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex gap-3 items-end w-full">
                      <div className="flex-1">
                        <label className="block font-body font-medium text-[12px] text-ink-gray-70 mb-1">Category Name</label>
                        <input
                          type="text"
                          placeholder="General Admission"
                          value={cat.name}
                          onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)}
                          className="font-body text-[14px] font-normal text-ink-black bg-brand-white border-2 border-ink-black rounded-12 py-2 px-3 w-full outline-none focus:border-brand-blue"
                          required
                        />
                      </div>
                      
                      <div className="w-24">
                        <label className="block font-body font-medium text-[12px] text-ink-gray-70 mb-1">Price ($)</label>
                        <input
                          type="number"
                          placeholder="85"
                          value={cat.price}
                          onChange={(e) => handleCategoryChange(idx, 'price', e.target.value)}
                          className="font-body text-[14px] font-normal text-ink-black bg-brand-white border-2 border-ink-black rounded-12 py-2 px-3 w-full outline-none focus:border-brand-blue"
                          required
                        />
                      </div>

                      <div className="w-24">
                        <label className="block font-body font-medium text-[12px] text-ink-gray-70 mb-1">Quantity</label>
                        <input
                          type="number"
                          placeholder="1500"
                          value={cat.quantity}
                          onChange={(e) => handleCategoryChange(idx, 'quantity', e.target.value)}
                          className="font-body text-[14px] font-normal text-ink-black bg-brand-white border-2 border-ink-black rounded-12 py-2 px-3 w-full outline-none focus:border-brand-blue"
                          required
                        />
                      </div>

                      {categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryRow(idx)}
                          className="w-10 h-10 border-2 border-ink-black rounded-12 flex items-center justify-center text-state-error bg-brand-white hover:bg-red-50 active:translate-y-px transition-all cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddCategoryRow}
                  className="self-start mt-1 font-body font-bold text-[13px] text-brand-blue bg-brand-white border-2 border-ink-black rounded-full px-4 py-2 hover:bg-brand-blue-light transition-all cursor-pointer select-none active:translate-y-px shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Add Ticket Category</span>
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full font-body font-bold text-[15px] text-brand-white bg-[#0000FF] border-3 border-ink-black rounded-full py-4.5 hover:bg-[#0000CC] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F] text-center mt-2"
              >
                Publish Event
              </button>

            </form>
          </div>

        </div>
      )}

    </div>
  );
};
