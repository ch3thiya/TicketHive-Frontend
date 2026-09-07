import React from 'react';

interface SignUpPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (role: 'customer' | 'organizer') => void;
}

export const SignUpPopUp: React.FC<SignUpPopUpProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm transition-all duration-300">
      
      {/* PopUp Card Container */}
      <div className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[480px] p-8 flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-ink-black flex items-center justify-center cursor-pointer hover:bg-brand-blue-light active:translate-y-px active:translate-x-px transition-all"
          aria-label="Close modal"
        >
          <span className="font-body font-bold text-sm text-ink-black select-none">✕</span>
        </button>

        {/* Heading */}
        <h2 className="font-heading font-bold text-[24px] text-ink-black text-center mt-3 mb-1.5 leading-snug">
          How will you use TicketHive?
        </h2>
        <p className="font-body text-[14px] text-ink-gray-70 text-center mb-6 leading-relaxed max-w-[340px]">
          Choose an option to sign in or create the right kind of account.
        </p>

        {/* Option Boxes Container */}
        <div className="flex flex-col gap-4 w-full">
          
          {/* Customer Choice Box */}
          <button
            onClick={() => onSelect('customer')}
            className="w-full bg-brand-blue-light border-3 border-ink-black rounded-20 p-4 flex items-center justify-between text-left cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-s transition-all duration-150 group"
          >
            <div className="flex items-center gap-4">
              {/* Left custom icon box */}
              <div className="w-12 h-12 rounded-14 border-2 border-ink-black flex items-center justify-center bg-brand-white shadow-[2px_2px_0px_0px_#0A0A0F]">
                <span className="text-xl select-none">🎫</span>
              </div>
              <div>
                <h4 className="font-body font-bold text-[16px] text-ink-black leading-tight">
                  I'm a Customer
                </h4>
                <p className="font-body text-[12px] text-ink-gray-70 mt-1 leading-none">
                  Browse events and book tickets
                </p>
              </div>
            </div>
            {/* Right arrow */}
            <span className="font-body font-bold text-lg text-brand-blue group-hover:translate-x-1 transition-transform select-none pr-1">
              ➔
            </span>
          </button>

          {/* Organizer Choice Box */}
          <button
            onClick={() => onSelect('organizer')}
            className="w-full bg-surface-yellow border-3 border-ink-black rounded-20 p-4 flex items-center justify-between text-left cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-s transition-all duration-150 group"
          >
            <div className="flex items-center gap-4">
              {/* Left custom icon box */}
              <div className="w-12 h-12 rounded-14 border-2 border-ink-black flex items-center justify-center bg-brand-white shadow-[2px_2px_0px_0px_#0A0A0F]">
                <span className="text-xl select-none">🎪</span>
              </div>
              <div>
                <h4 className="font-body font-bold text-[16px] text-ink-black leading-tight">
                  I'm an Organizer
                </h4>
                <p className="font-body text-[12px] text-ink-gray-70 mt-1 leading-none">
                  Create events and manage sales
                </p>
              </div>
            </div>
            {/* Right arrow */}
            <span className="font-body font-bold text-lg text-ink-black group-hover:translate-x-1 transition-transform select-none pr-1">
              ➔
            </span>
          </button>

        </div>

      </div>
      
    </div>
  );
};
