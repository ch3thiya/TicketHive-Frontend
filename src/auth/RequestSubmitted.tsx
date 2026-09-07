import React from 'react';
import { Button } from '../components/Button';

interface RequestSubmittedProps {
  onBack: () => void;
}

export const RequestSubmitted: React.FC<RequestSubmittedProps> = ({
  onBack,
}) => {
  return (
    <div className="bg-blue-pattern min-h-screen flex items-center justify-center p-6">
      <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full max-w-[540px] py-12 px-8 flex flex-col items-center text-center z-10 animate-in fade-in zoom-in-95 duration-250">
        
        {/* Confetti Popper Illustration/Emoji */}
        <div className="w-20 h-20 flex items-center justify-center bg-brand-white rounded-full border-3 border-ink-black shadow-brutal-s text-4xl select-none mb-6">
          🎉
        </div>

        {/* Heading */}
        <h2 className="font-heading font-bold text-[28px] text-ink-black mb-3.5 leading-tight">
          Request submitted!
        </h2>

        {/* Subtitle / Details */}
        <p className="font-body text-[15px] text-ink-gray-70 mb-8 leading-relaxed max-w-[420px]">
          We've received your organizer request. Keep an eye on your inbox — we'll notify you as soon as it's approved, usually within 1-2 business days.
        </p>

        {/* Action Button */}
        <Button
          variant="secondary"
          size="L"
          shadow="M"
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          Back to Home
        </Button>
        
      </div>
    </div>
  );
};
