import React from 'react';
import { Upload } from 'lucide-react';
import { Input } from '../components/Input';

interface EditEventPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedEventName?: string;
  eventName: string;
  setEventName: (val: string) => void;
  eventCategory: string;
  setEventCategory: (val: string) => void;
  cancellationCutoffHours: string;
  setCancellationCutoffHours: (val: string) => void;
  eventDate: string;
  setEventDate: (val: string) => void;
  eventTime: string;
  setEventTime: (val: string) => void;
  eventDesc: string;
  setEventDesc: (val: string) => void;
  eventBannerUrl: string;
  setEventBannerUrl: (val: string) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

export const EditEventPopUp: React.FC<EditEventPopUpProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedEventName,
  eventName,
  setEventName,
  eventCategory,
  setEventCategory,
  cancellationCutoffHours,
  setCancellationCutoffHours,
  eventDate,
  setEventDate,
  eventTime,
  setEventTime,
  eventDesc,
  setEventDesc,
  eventBannerUrl,
  setEventBannerUrl,
  handleImageChange,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-4xl my-8 p-8 flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light transition-all"
        >
          <span className="font-bold text-sm text-ink-black">✕</span>
        </button>

        <h2 className="font-heading font-bold text-[24px] text-ink-black mb-1">
          Edit Event
        </h2>

        <p className="text-xs text-ink-gray-70 mb-5 border-b border-ink-gray-30 pb-3">
          Update details for <strong>{selectedEventName || 'Event'}</strong>.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Event Name *"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />

          <div className="flex gap-4 w-full flex-col sm:flex-row">
            <div className="flex-1">
              <Input
                label="Category"
                type="text"
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
              />
            </div>

            <div className="flex-1">
              <Input
                label="Cancellation Cutoff Hours"
                type="text"
                value={cancellationCutoffHours}
                onChange={(e) => setCancellationCutoffHours(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 w-full flex-col sm:flex-row">
            <Input
              label="Target Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="flex-1"
            />

            <Input
              label="Target Time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="flex-1"
            />
          </div>

          <Input
            label="Description"
            type="textarea"
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
          />

          {/* Banner Upload / URL */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[14px] text-ink-black">
              Event Banner URL or Upload
            </label>

            <Input
              label=""
              type="text"
              placeholder="https://example.com/banner.jpg"
              value={eventBannerUrl}
              onChange={(e) => setEventBannerUrl(e.target.value)}
            />

            <label className="border-2 border-dashed border-ink-gray-30 bg-[#F9F9FC] rounded-16 p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-brand-blue-light/35 transition-all text-xs font-bold text-ink-black">
              <Upload size={16} className="text-brand-blue" />
              <span>Upload New Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {/* Banner Image Preview */}
            {eventBannerUrl && (
              <div className="relative mt-2 border-3 border-ink-black rounded-20 overflow-hidden bg-brand-white shadow-soft-3d">
                <img
                  src={eventBannerUrl}
                  alt="Event Banner Preview"
                  className="w-full h-[180px] object-cover"
                />
                <div className="absolute top-3 left-3 bg-brand-white border-2 border-ink-black rounded-full px-3 py-1 text-[11px] font-bold text-ink-black shadow-[2px_2px_0px_0px_#0A0A0F]">
                  Banner Preview
                </div>
                <button
                  type="button"
                  onClick={() => setEventBannerUrl('')}
                  className="absolute top-3 right-3 bg-[#FF3B3B] text-brand-white border-2 border-ink-black rounded-full px-3 py-1 text-[11px] font-bold shadow-[2px_2px_0px_0px_#0A0A0F] hover:bg-[#D32F2F] cursor-pointer transition-all"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-body font-bold text-[15px] text-brand-white bg-brand-blue border-3 border-ink-black rounded-full py-3.5 hover:bg-[#1a1a5b] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 mt-3 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
