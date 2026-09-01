import React from 'react';

interface ConfirmDeletePopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmDeletePopUp: React.FC<ConfirmDeletePopUpProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Request?",
  description = "Are you sure you want to proceed with this action?",
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-brand-white border-3 border-ink-black rounded-32 shadow-soft-3d w-full max-w-[480px] p-8 flex flex-col items-center relative animate-in zoom-in-95 duration-200">
        
        {/* Warning Emoji Badge */}
        <div className="w-16 h-16 rounded-full border-3 border-ink-black flex items-center justify-center bg-[#FF3B3B]/10 shadow-[3px_3px_0px_0px_#0A0A0F] text-2xl select-none mb-5 animate-bounce">
          ⚠️
        </div>

        {/* Heading */}
        <h2 className="font-heading font-bold text-[24px] text-ink-black text-center mb-2 leading-tight">
          {title}
        </h2>
        
        {/* Warning Subtitle */}
        <div className="font-body text-[14px] text-ink-gray-70 text-center mb-6 leading-relaxed">
          {description}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 font-body font-bold text-[14px] text-ink-black bg-brand-white border-2.5 border-ink-black rounded-full py-3 hover:bg-brand-blue-light transition-all cursor-pointer active:translate-y-px select-none text-center outline-none disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 font-body font-bold text-[14px] text-brand-white bg-[#FF3B3B] border-2.5 border-ink-black rounded-full py-3 hover:bg-[#E02424] transition-all cursor-pointer active:translate-y-[2px] shadow-brutal-s select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0A0A0F] outline-none disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
