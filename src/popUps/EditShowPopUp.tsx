import React from 'react';
import { Plus } from 'lucide-react';
import { Input } from '../components/Input';
import { VenueSelect } from '../components/VenueSelect';
import type { Venue } from '../common/venueApi';
import type { TicketCategoryInput } from './AddShowPopUp';

interface EditShowPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  showDate: string;
  setShowDate: (val: string) => void;
  showTime: string;
  setShowTime: (val: string) => void;
  showVenueId: string;
  setShowVenueId: (val: string) => void;
  venues: Venue[];
  venuesError?: string | null;
  showOnSaleAt: string;
  setShowOnSaleAt: (val: string) => void;
  showHighDemandThreshold: string;
  setShowHighDemandThreshold: (val: string) => void;
  showCategories: TicketCategoryInput[];
  handleAddCategoryRow: () => void;
  handleCategoryChange: (index: number, field: keyof TicketCategoryInput, value: string) => void;
  handleRemoveCategoryRow: (index: number) => void;
  isLoading: boolean;
}

export const EditShowPopUp: React.FC<EditShowPopUpProps> = ({
  isOpen,
  onClose,
  onSubmit,
  showDate,
  setShowDate,
  showTime,
  setShowTime,
  showVenueId,
  setShowVenueId,
  venues,
  venuesError,
  showOnSaleAt,
  setShowOnSaleAt,
  showHighDemandThreshold,
  setShowHighDemandThreshold,
  showCategories,
  handleAddCategoryRow,
  handleCategoryChange,
  handleRemoveCategoryRow,
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
          Edit Show Schedule & Policies
        </h2>

        <p className="text-xs text-ink-gray-70 mb-5 border-b border-ink-gray-30 pb-3">
          Modify timing, venue settings, and ticket pricing tiers for this show.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4 w-full flex-col sm:flex-row">
            <Input
              label="Show Date *"
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              required
              className="flex-1"
            />

            <Input
              label="Show Time *"
              type="time"
              value={showTime}
              onChange={(e) => setShowTime(e.target.value)}
              required
              className="flex-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VenueSelect
              venues={venues}
              value={showVenueId}
              onChange={setShowVenueId}
              error={venuesError}
            />

            <Input
              label="High Demand Threshold"
              type="text"
              value={showHighDemandThreshold}
              onChange={(e) => setShowHighDemandThreshold(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 w-full text-left">
            <label
              htmlFor="edit-show-on-sale-at"
              className="font-body font-semibold text-[14px] text-ink-black tracking-[0.2px]"
            >
              On-Sale Date & Time (Optional)
            </label>
            <input
              id="edit-show-on-sale-at"
              type="datetime-local"
              value={showOnSaleAt}
              onChange={(e) => setShowOnSaleAt(e.target.value)}
              className="font-body text-[15px] font-normal text-ink-black bg-brand-white border-3 border-ink-black rounded-16 py-3.5 px-4 w-full outline-none transition-all duration-150 ease-in-out placeholder-ink-gray-70 focus:border-brand-blue focus:shadow-brutal-s"
            />
          </div>

          <hr className="border-ink-gray-30" />

          {/* Ticket Categories */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-body font-bold text-[15px] text-ink-black">
                Ticket Categories & Capacities *
              </h3>

              <button
                type="button"
                onClick={handleAddCategoryRow}
                className="font-bold text-xs text-brand-blue bg-brand-white border-2 border-ink-black rounded-full px-3 py-1 hover:bg-brand-blue-light transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {showCategories.map((cat, idx) => (
                <div key={idx} className="flex gap-3 items-end w-full">
                  <div className="flex-1">
                    <label className="block font-medium text-[12px] text-ink-gray-70 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      placeholder="General Admission, VIP, Balcony"
                      value={cat.name}
                      onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)}
                      className="text-[14px] text-ink-black bg-brand-white border-2 border-ink-black rounded-12 py-2 px-3 w-full outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="block font-medium text-[12px] text-ink-gray-70 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50"
                      value={cat.price}
                      onChange={(e) => handleCategoryChange(idx, 'price', e.target.value)}
                      className="text-[14px] text-ink-black bg-brand-white border-2 border-ink-black rounded-12 py-2 px-3 w-full outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="block font-medium text-[12px] text-ink-gray-70 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={cat.capacity}
                      onChange={(e) => handleCategoryChange(idx, 'capacity', e.target.value)}
                      className="text-[14px] text-ink-black bg-brand-white border-2 border-ink-black rounded-12 py-2 px-3 w-full outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  {showCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryRow(idx)}
                      className="h-10 px-3 font-bold text-xs text-[#FF3B3B] bg-brand-white border-2 border-ink-black rounded-12 hover:bg-[#FF3B3B]/10 transition-all cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-body font-bold text-[15px] text-brand-white bg-brand-blue border-3 border-ink-black rounded-full py-3.5 hover:bg-[#1a1a5b] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 mt-3 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Show Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
