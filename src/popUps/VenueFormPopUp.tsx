import React, { useEffect, useState } from 'react';
import { Input } from '../components/Input';
import type { VenueInput } from '../common/venueApi';

interface VenueFormPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: VenueInput) => void;
  mode: 'create' | 'edit';
  initialValues?: VenueInput;
  isLoading: boolean;
  error?: string | null;
}

interface FieldErrors {
  name?: string;
  address?: string;
  capacity?: string;
}

const EMPTY_VALUES: VenueInput = { name: '', address: '', capacity: 0 };

export const VenueFormPopUp: React.FC<VenueFormPopUpProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialValues,
  isLoading,
  error
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (isOpen) {
      const values = initialValues || EMPTY_VALUES;
      setName(values.name);
      setAddress(values.address);
      setCapacity(values.capacity ? String(values.capacity) : '');
      setFieldErrors({});
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedCapacity = capacity.trim();

    const errors: FieldErrors = {};
    if (!trimmedName) errors.name = 'Venue name is required.';
    if (!trimmedAddress) errors.address = 'Address is required.';
    if (!/^\d+$/.test(trimmedCapacity) || Number(trimmedCapacity) <= 0) {
      errors.capacity = 'Capacity must be a positive whole number.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      name: trimmedName,
      address: trimmedAddress,
      capacity: Number(trimmedCapacity)
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-lg my-8 p-8 flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light transition-all"
        >
          <span className="font-bold text-sm text-ink-black">✕</span>
        </button>

        <h2 className="font-heading font-bold text-[24px] text-ink-black mb-1">
          {mode === 'create' ? 'Add Venue' : 'Edit Venue'}
        </h2>

        <p className="text-xs text-ink-gray-70 mb-5 border-b border-ink-gray-30 pb-3">
          {mode === 'create'
            ? 'Add a new venue organizers can pick when scheduling a show.'
            : 'Update this venue\'s details.'}
        </p>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-16 p-3 mb-4 text-[#FF3B3B] font-medium text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Venue Name *"
            type="text"
            placeholder="e.g. Madison Square Garden"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />

          <Input
            label="Address *"
            type="text"
            placeholder="e.g. New York, NY"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={fieldErrors.address}
          />

          <Input
            label="Capacity *"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 20000"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            error={fieldErrors.capacity}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-body font-bold text-[15px] text-brand-white bg-brand-blue border-3 border-ink-black rounded-full py-3.5 hover:bg-[#1a1a5b] active:translate-y-[2px] transition-all cursor-pointer shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 mt-3 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : mode === 'create' ? 'Add Venue' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
